import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function CTASection() {
    return (
        <section className="py-20 md:py-32 relative overflow-hidden">
            {/* Background effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-purple-600/5 to-transparent"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl"></div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                        <Sparkles className="w-4 h-4" />
                        Ready to start?
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">
                        Start Your First{" "}
                        <span className="gradient-text">Exchange</span> Now
                    </h2>
                    <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                        Join thousands of users who trust Spark Exchange for fast, secure, and anonymous cryptocurrency swaps.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button variant="gradient" size="xl" asChild>
                            <Link href="#exchange">
                                Start Exchange
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </Button>
                        <Button variant="outline" size="xl" asChild>
                            <Link href="#how-it-works">Learn More</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
