"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, Mail, MessageSquare } from "lucide-react";

export function ContactSection() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSubmitted(true);
        }, 2000);
    };

    return (
        <section id="contact" className="py-20 md:py-32">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
                    {/* Left Content */}
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Have Some <span className="gradient-text">Questions</span>?
                        </h2>
                        <p className="text-muted-foreground text-lg mb-8">
                            Please use the contact form to reach us. We typically respond within 24 hours.
                        </p>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Mail className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium">Email Support</p>
                                    <p className="text-sm text-muted-foreground">
                                        support@sparkexchange.io
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <MessageSquare className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium">Live Chat</p>
                                    <p className="text-sm text-muted-foreground">
                                        Available 24/7
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="glass rounded-2xl p-8">
                        {isSubmitted ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                                    <Send className="w-8 h-8 text-green-500" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2">Message Sent!</h3>
                                <p className="text-muted-foreground">
                                    We'll get back to you as soon as possible.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Name</label>
                                        <Input
                                            placeholder="Your name"
                                            required
                                            className="bg-secondary/50 border-0"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Email</label>
                                        <Input
                                            type="email"
                                            placeholder="your@email.com"
                                            required
                                            className="bg-secondary/50 border-0"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Subject</label>
                                    <Input
                                        placeholder="How can we help?"
                                        required
                                        className="bg-secondary/50 border-0"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Message</label>
                                    <Textarea
                                        placeholder="Your message..."
                                        required
                                        className="bg-secondary/50 border-0 min-h-[150px]"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    variant="gradient"
                                    size="lg"
                                    className="w-full"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" />
                                            Send Message
                                        </>
                                    )}
                                </Button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
