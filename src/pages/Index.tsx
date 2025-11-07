import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TrendingUp,
  Users,
  GraduationCap,
  Activity,
  Network,
  DollarSign,
} from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const features = [
    {
      icon: Users,
      title: "Participation Tracking",
      description:
        "Monitor attendance, punctuality, and consistency across all meetings and events.",
    },
    {
      icon: GraduationCap,
      title: "Learning Management",
      description:
        "Track study hours, mentorship sessions, and training engagement.",
    },
    {
      icon: Activity,
      title: "Activity Monitoring",
      description:
        "Record referrals given and received, plus chapter involvement activities.",
    },
    {
      icon: Network,
      title: "Networking Analytics",
      description:
        "Track one-on-one meetings and partnerships created within your network.",
    },
    {
      icon: DollarSign,
      title: "Trade Management",
      description:
        "Monitor business passed, deals closed, and transaction values with integrated payments.",
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-6">
            <TrendingUp className="h-12 w-12 text-primary" />
            <h1 className="text-4xl md:text-6xl font-bold">PLANT Metrics</h1>
          </div>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Track your business network growth with comprehensive PLANT metrics
            tracking, real-time leaderboards, and integrated payment management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Get Started
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/auth")}
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="hover:shadow-lg transition-shadow duration-300"
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* PLANT Acronym Explanation */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">What is PLANT?</CardTitle>
            <CardDescription>
              A comprehensive business networking framework for tracking success
              metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="w-12 h-12 bg-participation/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-xl font-bold text-participation">
                    P
                  </span>
                </div>
                <h3 className="font-semibold">Participation</h3>
                <p className="text-sm text-muted-foreground">
                  Attendance & Engagement
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-learning/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-xl font-bold text-learning">L</span>
                </div>
                <h3 className="font-semibold">Learning</h3>
                <p className="text-sm text-muted-foreground">
                  Training & Development
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-activity/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-xl font-bold text-activity">A</span>
                </div>
                <h3 className="font-semibold">Activity</h3>
                <p className="text-sm text-muted-foreground">
                  Referrals & Involvement
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-networking/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-xl font-bold text-networking">N</span>
                </div>
                <h3 className="font-semibold">Networking</h3>
                <p className="text-sm text-muted-foreground">
                  Meetings & Partnerships
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-trade/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-xl font-bold text-trade">T</span>
                </div>
                <h3 className="font-semibold">Trade</h3>
                <p className="text-sm text-muted-foreground">
                  Business & Revenue
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
