"use client";

import { useState, useEffect } from "react";
import { CreditCard, Download, Calendar, DollarSign, CheckCircle, FileText, X, Zap, Crown, Rocket, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import { showSuccessToast } from "@/lib/toast";

const plans = [
  {
    id: "basic",
    name: "Basic",
    price: 19.99,
    icon: Rocket,
    color: "from-blue-500 to-cyan-500",
    description: "Perfect for small teams getting started",
    features: [
      "Up to 5 team members",
      "5 GB storage",
      "Basic analytics",
      "Email support",
      "Mobile app access",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    price: 49.99,
    icon: Zap,
    color: "from-brand-teal to-brand-purple",
    description: "Most popular for growing businesses",
    popular: true,
    features: [
      "Up to 10 team members",
      "10 GB storage",
      "Advanced analytics",
      "Email integration",
      "API access",
      "Priority support",
      "Custom workflows",
      "Export capabilities",
      "Mobile app access",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 99.99,
    icon: Crown,
    color: "from-purple-600 to-pink-600",
    description: "Advanced features for large organizations",
    features: [
      "Unlimited team members",
      "Unlimited storage",
      "Advanced analytics",
      "All integrations",
      "API access",
      "24/7 Priority support",
      "Custom workflows",
      "Export capabilities",
      "Mobile app access",
      "Dedicated account manager",
      "Custom SLA",
      "Advanced security",
    ],
  },
];

export default function BillingPage() {
  const [billingInfo] = useState({
    plan: "Professional",
    price: 49.99,
    billingCycle: "Monthly",
    nextBillingDate: "Feb 28, 2026",
    paymentMethod: "•••• •••• •••• 4242",
    cardType: "Visa",
    cardExpiry: "12/2026",
  });

  const [showPlansModal, setShowPlansModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showPlansModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showPlansModal]);

  const invoices = [
    {
      id: 1,
      invoiceNumber: "INV-2026-001",
      date: "Jan 28, 2026",
      amount: 49.99,
      status: "Paid",
      description: "Professional Plan - January 2026",
    },
    {
      id: 2,
      invoiceNumber: "INV-2025-012",
      date: "Dec 28, 2025",
      amount: 49.99,
      status: "Paid",
      description: "Professional Plan - December 2025",
    },
    {
      id: 3,
      invoiceNumber: "INV-2025-011",
      date: "Nov 28, 2025",
      amount: 49.99,
      status: "Paid",
      description: "Professional Plan - November 2025",
    },
  ];

  const getStatusColor = (status: string) => {
    return status === "Paid"
      ? "bg-secondary/20 text-secondary"
      : "bg-accent/20 text-accent";
  };

  const handleUpgrade = (planId: string) => {
    setSelectedPlan(planId);
    const plan = plans.find(p => p.id === planId);
    showSuccessToast(`Upgrading to ${plan?.name} plan...`);
    // In production: Redirect to payment gateway or show payment modal
    setTimeout(() => {
      setShowPlansModal(false);
    }, 1500);
  };

  const handleDownloadInvoice = (invoiceNumber: string) => {
    showSuccessToast(`Downloading ${invoiceNumber}...`);
    // In production: Generate and download PDF invoice
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Billing & Subscription"
        icon={CreditCard}
        iconBgColor="bg-primary/10"
        iconColor="text-primary"
        subtitle="Manage your subscription and payment methods"
        actions={
          <Button
            className="bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
            size="sm"
            onClick={() => setShowPlansModal(true)}
          >
            <Zap className="h-4 w-4 mr-2" />
            Upgrade Plan
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Plan */}
        <Card className="p-6 border border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Current Plan</h3>
              <p className="text-sm text-muted-foreground">{billingInfo.billingCycle}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-3xl font-bold text-foreground">
                ${billingInfo.price}
                <span className="text-sm font-normal text-muted-foreground">/month</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">{billingInfo.plan} Plan</p>
            </div>
            <div className="pt-3 border-t border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Renews on {billingInfo.nextBillingDate}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Payment Method */}
        <Card className="p-6 border border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Payment Method</h3>
              <p className="text-sm text-muted-foreground">{billingInfo.cardType}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-lg font-mono text-foreground">{billingInfo.paymentMethod}</p>
              <p className="text-sm text-muted-foreground mt-1">Expires {billingInfo.cardExpiry}</p>
            </div>
            <div className="pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => showSuccessToast("Payment method update coming soon...")}
              >
                Update Card
              </Button>
            </div>
          </div>
        </Card>

        {/* Usage Summary */}
        <Card className="p-6 border border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Usage Summary</h3>
              <p className="text-sm text-muted-foreground">Current Period</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Users</span>
                <span className="text-foreground font-medium">5 / 10</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-accent h-2 rounded-full" style={{ width: "50%" }}></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Storage</span>
                <span className="text-foreground font-medium">2.4 GB / 10 GB</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: "24%" }}></div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Invoice History */}
      <Card className="border border-border">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Invoice History</h3>
          <p className="text-sm text-muted-foreground mt-1">Download your past invoices</p>
        </div>
        <div className="divide-y divide-border">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h4 className="font-semibold text-foreground">{invoice.invoiceNumber}</h4>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        invoice.status
                      )}`}
                    >
                      {invoice.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{invoice.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {invoice.date}
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      ${invoice.amount}
                    </div>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="sm:w-auto w-full"
                onClick={() => handleDownloadInvoice(invoice.invoiceNumber)}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Plan Features */}
      <Card className="p-6 border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Plan Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            "Up to 10 team members",
            "10 GB storage",
            "Advanced analytics",
            "Email integration",
            "API access",
            "Priority support",
            "Custom workflows",
            "Export capabilities",
            "Mobile app access",
          ].map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-secondary flex-shrink-0" />
              <span className="text-sm text-foreground">{feature}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-6 border-t border-border">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowPlansModal(true)}
            >
              View All Plans
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-brand-teal to-brand-purple hover:opacity-90"
              onClick={() => handleUpgrade("enterprise")}
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Enterprise
            </Button>
          </div>
        </div>
      </Card>

      {/* Plans Modal */}
      {showPlansModal && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] transition-opacity"
            onClick={() => setShowPlansModal(false)}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[10000] flex items-start sm:items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl my-4 sm:my-8 animate-in fade-in zoom-in duration-200">
              {/* Header */}
              <div className="relative bg-gradient-to-br from-brand-teal/10 via-brand-purple/10 to-brand-coral/10 p-6 rounded-t-2xl border-b border-border">
                <button
                  onClick={() => setShowPlansModal(false)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white hover:bg-gray-100 flex items-center justify-center transition-colors shadow-md"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
                <div className="max-w-2xl">
                  <h2 className="text-2xl font-bold text-foreground mb-2">Choose Your Plan</h2>
                  <p className="text-sm text-muted-foreground">Select the perfect plan for your business needs. Upgrade or downgrade anytime.</p>
                </div>
              </div>

              {/* Plans Grid */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {plans.map((plan) => {
                    const Icon = plan.icon;
                    const isCurrentPlan = plan.name === billingInfo.plan;

                    return (
                      <div
                        key={plan.id}
                        className={`relative flex flex-col bg-white rounded-xl border-2 transition-all duration-300 overflow-hidden ${plan.popular
                            ? "border-primary shadow-xl"
                            : isCurrentPlan
                              ? "border-secondary shadow-lg"
                              : "border-border shadow hover:shadow-lg hover:border-primary/30"
                          }`}
                      >
                        {/* Popular Badge */}
                        {plan.popular && (
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-teal via-brand-purple to-brand-coral" />
                        )}

                        {/* Card Content */}
                        <div className="p-6 flex-1 flex flex-col">
                          {/* Badge */}
                          {plan.popular && (
                            <div className="inline-flex items-center gap-2 self-start mb-4 px-3 py-1 bg-gradient-to-r from-brand-teal to-brand-purple text-white text-xs font-semibold rounded-full">
                              <Sparkles className="h-3 w-3" />
                              MOST POPULAR
                            </div>
                          )}

                          {/* Icon & Name */}
                          <div className="flex items-center gap-3 mb-3">
                            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${plan.color} flex items-center justify-center shadow-md`}>
                              <Icon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                              {isCurrentPlan && (
                                <span className="text-xs font-medium text-secondary">Active Plan</span>
                              )}
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>

                          {/* Price */}
                          <div className="mb-6">
                            <div className="flex items-baseline gap-1">
                              <span className="text-4xl font-bold text-foreground">${plan.price}</span>
                              <span className="text-base text-muted-foreground">/month</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Billed monthly • Cancel anytime</p>
                          </div>

                          {/* Features */}
                          <div className="space-y-3 mb-6 flex-1">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">What's included:</h4>
                            {plan.features.map((feature, index) => (
                              <div key={index} className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-secondary flex-shrink-0 mt-0.5" />
                                <span className="text-sm text-foreground">{feature}</span>
                              </div>
                            ))}
                          </div>

                          {/* Button */}
                          <Button
                            className={`w-full h-11 font-semibold text-sm rounded-lg transition-all duration-300 ${isCurrentPlan
                                ? "bg-secondary/20 text-secondary border-2 border-secondary/30 cursor-default"
                                : `bg-gradient-to-r ${plan.color} hover:opacity-90 text-white shadow-md hover:shadow-lg`
                              }`}
                            onClick={() => !isCurrentPlan && handleUpgrade(plan.id)}
                            disabled={isCurrentPlan}
                          >
                            {isCurrentPlan ? (
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                <span>Your Current Plan</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4" />
                                <span>Choose {plan.name}</span>
                              </div>
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-border">
                  <div className="text-center space-y-3">
                    <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-secondary" />
                        <span>14-day money-back guarantee</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-secondary" />
                        <span>Cancel anytime</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-secondary" />
                        <span>Free migration support</span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Need help choosing?
                      <button className="ml-1 text-primary hover:text-primary/80 font-semibold">
                        Contact our sales team
                      </button>
                      {" "}or call{" "}
                      <span className="font-semibold text-foreground">1-800-CRM-HELP</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
