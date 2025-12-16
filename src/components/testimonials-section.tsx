"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

const testimonials = [
    {
        name: "Ben",
        role: "Crypto Trader",
        content: "Fast Trades 😍 The exchange is incredibly quick and the rates are always competitive. Highly recommended!",
        rating: 5,
    },
    {
        name: "Monica",
        role: "Hodler",
        content: "Excellent Customer Support!! 🏆 They helped me with my transaction and were super responsive.",
        rating: 5,
    },
    {
        name: "Thomas",
        role: "Crypto Enthusiast",
        content: "Great Execution! 💪 No account needed, no hassle. Just swap and go!",
        rating: 5,
    },
    {
        name: "Sarah",
        role: "DeFi User",
        content: "Love the anonymity! 🔒 No KYC required and my transactions are always processed quickly.",
        rating: 5,
    },
    {
        name: "Michael",
        role: "Day Trader",
        content: "Best rates I've found! 📈 I've compared with other exchanges and Spark always comes out on top.",
        rating: 5,
    },
    {
        name: "Elena",
        role: "Investor",
        content: "So easy to use! ⚡ Even my non-tech-savvy friends can use this platform without any issues.",
        rating: 5,
    },
];

export function TestimonialsSection() {
    return (
        <section className="py-20 md:py-32 bg-secondary/20">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        What Our <span className="gradient-text">Users Say</span>
                    </h2>
                    <p className="text-muted-foreground">
                        Join thousands of satisfied users who trust Spark Exchange for their crypto swaps.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {testimonials.map((testimonial, index) => (
                        <Card
                            key={index}
                            className="bg-card/50 backdrop-blur-sm hover:scale-105 transition-all duration-300"
                        >
                            <CardContent className="p-6">
                                <Quote className="w-8 h-8 text-primary/30 mb-4" />
                                <p className="text-foreground/90 mb-4 leading-relaxed">
                                    {testimonial.content}
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white font-semibold">
                                        {testimonial.name[0]}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{testimonial.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {testimonial.role}
                                        </p>
                                    </div>
                                    <div className="ml-auto flex gap-0.5">
                                        {[...Array(testimonial.rating)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className="w-4 h-4 fill-yellow-500 text-yellow-500"
                                            />
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
