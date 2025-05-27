import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Brain, Users, Clock, FileCheck } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface TestimonialCardProps {
  name: string;
  role: string;
  image: string;
  quote: string;
}

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Hero Section */}
      <section className="pt-20 pb-32 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Master Your Interview Skills with AI
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Practice interviews with our advanced AI system. Get real-time feedback
            and improve your chances of landing your dream job.
          </p>
          <div className="flex gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate('/register')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">
            Why Choose Our Platform?
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            <FeatureCard
              icon={<Brain className="w-8 h-8 text-blue-600" />}
              title="AI-Powered Interviews"
              description="Experience realistic interviews with our advanced AI that adapts to your skill level"
            />
            <FeatureCard
              icon={<Clock className="w-8 h-8 text-blue-600" />}
              title="Flexible Duration"
              description="Choose interview length that fits your schedule"
            />
            <FeatureCard
              icon={<FileCheck className="w-8 h-8 text-blue-600" />}
              title="Detailed Feedback"
              description="Get comprehensive feedback and actionable insights to improve"
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">
            Success Stories
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <TestimonialCard
              name="Sarah Johnson"
              role="Software Engineer at Google"
              image="https://images.unsplash.com/photo-1494790108377-be9c29b29330"
              quote="This platform helped me prepare for my technical interviews. The AI feedback was incredibly valuable."
            />
            <TestimonialCard
              name="Michael Chen"
              role="Product Manager at Meta"
              image="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d"
              quote="The realistic interview scenarios and detailed feedback reports helped me land my dream job."
            />
          </div>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => (
  <div className="text-center p-6 rounded-lg bg-gray-50">
    <div className="flex justify-center mb-4">{icon}</div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const TestimonialCard = ({ name, role, image, quote }: TestimonialCardProps) => (
  <div className="bg-white p-6 rounded-lg shadow-sm">
    <div className="flex items-center mb-4">
      <img
        src={image}
        alt={name}
        className="w-12 h-12 rounded-full object-cover mr-4"
      />
      <div>
        <h4 className="font-semibold">{name}</h4>
        <p className="text-sm text-gray-600">{role}</p>
      </div>
    </div>
    <p className="text-gray-700 italic">"{quote}"</p>
  </div>
);

export default LandingPage;