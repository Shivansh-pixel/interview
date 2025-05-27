import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { generateQuestion, evaluateAnswer } from '@/lib/gemini';
import { jsPDF } from 'jspdf';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import FaceRecognition from '@/components/FaceRecognition';
import SpeechRecognition from '@/components/SpeechRecognition';
import { Clock, Award, Brain, Download } from 'lucide-react';

interface InterviewHistory {
  question: string;
  answer: string;
  feedback: string;
  score: number;
}

const Interview = () => {
  const { user } = useAuthStore();
  const [difficulty, setDifficulty] = useState('');
  const [domain, setDomain] = useState('');
  const [duration, setDuration] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [interviewHistory, setInterviewHistory] = useState<InterviewHistory[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isInterviewStarted && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isInterviewStarted, timeRemaining]);

  const handleTimeUp = async () => {
    if (userAnswer.trim() && !isEvaluating) {
      await submitAnswer();
    }
    endInterview();
  };

  const startInterview = async () => {
    if (!difficulty || !duration || !domain) {
      setError('Please select difficulty level, duration, and domain');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const question = await generateQuestion(difficulty.toLowerCase(), domain);
      
      const { data: interview, error: dbError } = await supabase
        .from('interviews')
        .insert({
          user_id: user!.id,
          difficulty: difficulty.toLowerCase(),
          duration: duration,
          domain: domain
        })
        .select()
        .single();

      if (dbError) throw dbError;
      
      setInterviewId(interview.id);
      setCurrentQuestion(question);
      setTimeRemaining(duration * 60);
      setIsInterviewStarted(true);
      setInterviewHistory([]);
    } catch (error) {
      console.error('Error starting interview:', error);
      setError('Failed to start interview. Please try again.');
      setIsInterviewStarted(false);
    }
    setIsLoading(false);
  };

  const submitAnswer = async () => {
    if (!currentQuestion || !userAnswer.trim() || isEvaluating) {
      return;
    }

    setIsEvaluating(true);
    setError('');
    try {
      const context = interviewHistory
        .map(h => `Q: ${h.question}\nA: ${h.answer}\nFeedback: ${h.feedback}`)
        .join('\n\n');

      const feedback = await evaluateAnswer(currentQuestion, userAnswer, context);
      
      // Extract score from feedback (assuming it's in the format "Score: X/10" or similar)
      const scoreMatch = feedback.match(/\b(\d+)\/10\b/);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 5;

      const newHistory = [...interviewHistory, {
        question: currentQuestion,
        answer: userAnswer,
        feedback,
        score
      }];
      
      setInterviewHistory(newHistory);

      if (interviewId) {
        await supabase
          .from('interviews')
          .update({
            score: score,
            feedback: newHistory
          })
          .eq('id', interviewId);
      }

      // Generate next question based on the conversation history
      const nextQuestion = await generateQuestion(
        difficulty.toLowerCase(),
        domain,
        context + `\n\nQ: ${currentQuestion}\nA: ${userAnswer}\nFeedback: ${feedback}`
      );

      setCurrentQuestion(nextQuestion);
      setUserAnswer('');
    } catch (error) {
      console.error('Error evaluating answer:', error);
      setError('Failed to evaluate answer. Please try again.');
    }
    setIsEvaluating(false);
  };

  const endInterview = () => {
    setIsInterviewStarted(false);
    setTimeRemaining(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const downloadTranscript = () => {
    const doc = new jsPDF();
    let yPos = 20;

    doc.setFontSize(16);
    doc.text('Interview Transcript', 20, yPos);
    yPos += 20;

    interviewHistory.forEach((item, index) => {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Question ${index + 1}:`, 20, yPos);
      yPos += 10;
      
      doc.setFont('helvetica', 'normal');
      doc.text(item.question, 20, yPos, { maxWidth: 170 });
      yPos += 20;

      doc.setFont('helvetica', 'bold');
      doc.text('Your Answer:', 20, yPos);
      yPos += 10;
      
      doc.setFont('helvetica', 'normal');
      doc.text(item.answer, 20, yPos, { maxWidth: 170 });
      yPos += 20;

      doc.setFont('helvetica', 'bold');
      doc.text('Feedback:', 20, yPos);
      yPos += 10;
      
      doc.setFont('helvetica', 'normal');
      doc.text(item.feedback, 20, yPos, { maxWidth: 170 });
      yPos += 30;

      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
    });

    doc.save('interview-transcript.pdf');
  };

  const handleConfidenceChange = (newConfidence: number) => {
    setConfidence(newConfidence);
  };

  const handleSpeechResult = (text: string) => {
    setUserAnswer(text);
  };

  if (!isInterviewStarted) {
    return (
      <div className="max-w-4xl mx-auto pt-24 px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-3 mb-8">
            <Brain className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Setup Your Interview</h1>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-md border border-red-200">
              {error}
            </div>
          )}
          
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Select Domain</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  'Frontend Development',
                  'Backend Development',
                  'System Design',
                  'Data Structures',
                  'Algorithms',
                  'DevOps'
                ].map((d) => (
                  <Button
                    key={d}
                    variant={domain === d ? 'default' : 'outline'}
                    onClick={() => setDomain(d)}
                    className="w-full"
                  >
                    {d}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Select Difficulty Level</h2>
              <div className="grid grid-cols-3 gap-4">
                {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                  <Button
                    key={level}
                    variant={difficulty === level ? 'default' : 'outline'}
                    onClick={() => setDifficulty(level)}
                    className="w-full"
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Select Duration (minutes)</h2>
              <div className="grid grid-cols-4 gap-4">
                {[15, 30, 45, 60].map((time) => (
                  <Button
                    key={time}
                    variant={duration === time ? 'default' : 'outline'}
                    onClick={() => setDuration(time)}
                    className="w-full"
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <Button
            onClick={startInterview}
            className="w-full mt-8 bg-blue-600 hover:bg-blue-700"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? 'Starting Interview...' : 'Start Interview'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pt-24 px-4">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-md border border-red-200">
            {error}
          </div>
        )}
        
        <div className="flex justify-between items-center mb-8 border-b pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold">Question {interviewHistory.length + 1}</h2>
            </div>
            <p className="text-gray-600">Domain: {domain} • Level: {difficulty}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-xl font-semibold mb-2">
              <Clock className="w-6 h-6 text-blue-600" />
              <span>{formatTime(timeRemaining)}</span>
            </div>
            <Button
              variant="destructive"
              onClick={endInterview}
              size="sm"
            >
              End Interview
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">Current Question</h3>
              <p className="text-lg text-gray-800">{currentQuestion}</p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-4">Your Answer</h3>
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className="w-full h-48 p-4 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Type your answer here or use voice recognition..."
                disabled={isEvaluating || timeRemaining === 0}
              />
            </div>

            <div className="flex gap-4">
              <Button
                onClick={submitAnswer}
                className="flex-1"
                disabled={isEvaluating || !userAnswer.trim() || timeRemaining === 0}
              >
                {isEvaluating ? 'Evaluating...' : 'Submit Answer'}
              </Button>
              
              <Button
                onClick={downloadTranscript}
                variant="outline"
                disabled={interviewHistory.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Download Transcript
              </Button>
            </div>

            <SpeechRecognition
              onSpeechResult={handleSpeechResult}
              question={currentQuestion}
            />
          </div>

          <div className="space-y-6">
            <FaceRecognition onConfidenceChange={handleConfidenceChange} />
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3">Confidence Level</h3>
              <div className="w-full bg-gray-200 rounded-full h-6">
                <div
                  className="bg-blue-600 h-6 rounded-full transition-all duration-300 relative"
                  style={{ width: `${confidence}%` }}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-white text-sm font-medium">
                    {confidence}%
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {confidence < 30 ? 'Take deep breaths and stay calm' : 
                 confidence < 70 ? 'You\'re doing well' : 'Excellent presence!'}
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold">Interview History</h3>
              {interviewHistory.map((item, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="font-semibold">Question {index + 1}:</p>
                    <p className="text-gray-700">{item.question}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Your Answer:</p>
                    <p className="text-gray-700">{item.answer}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Feedback:</p>
                    <p className="text-gray-700">{item.feedback}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interview;