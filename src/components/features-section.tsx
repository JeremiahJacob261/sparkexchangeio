import { Shield, Zap, Lock, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
    {
        icon: Zap,
        title: "Fast Swaps",
        description: "Exchange completed in as little as 2-5 minutes with deep liquidity.",
    },
    {
        icon: Shield,
        title: "Non-Custodial",
        description: "We don't control your funds. Your keys, your crypto.",
    },
    {
        icon: Lock,
        title: "No Account Needed",
        description: "Start swapping immediately without registration or KYC.",
    },
    {
        icon: Clock,
        title: "Open 24/7",
        description: "Trade anytime, anywhere. Our service never sleeps.",
    },
];

export function FeaturesSection() {
    return (
        <section id="about" className="py-20 md:py-32">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">
                            <span className="gradient-text">Decentralized</span> Exchange
                        </h2>
                        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                            Spark Exchange is a non-custodial cryptocurrency exchange service.
                            We respect your privacy and security. Swap between 900+
                            cryptocurrencies with the best possible rates.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {features.map((feature, index) => (
                                <Card
                                    key={index}
                                    className="bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-300"
                                >
                                    <CardContent className="p-5">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                                            <feature.icon className="w-6 h-6 text-primary" />
                                        </div>
                                        <h3 className="font-semibold mb-2">{feature.title}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {feature.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Stats/Visual */}
                    <div className="relative">
                        <div className="glass rounded-3xl p-8 md:p-12">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="text-center p-6 rounded-2xl bg-secondary/50">
                                    <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">
                                        900+
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Cryptocurrencies
                                    </p>
                                </div>
                                <div className="text-center p-6 rounded-2xl bg-secondary/50">
                                    <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">
                                        5M+
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Transactions
                                    </p>
                                </div>
                                <div className="text-center p-6 rounded-2xl bg-secondary/50">
                                    <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">
                                        24/7
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Availability
                                    </p>
                                </div>
                                <div className="text-center p-6 rounded-2xl bg-secondary/50">
                                    <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">
                                        0%
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Hidden Fees
                                    </p>
                                </div>
                            </div>
                        </div>
                        {/* Decorative elements */}
                        <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl"></div>
                    </div>
                </div>
            </div>
        </section>
    );
}
