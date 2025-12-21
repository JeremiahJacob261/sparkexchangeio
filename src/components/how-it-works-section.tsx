import { MousePointer, Send, Wallet } from "lucide-react";

const steps = [
    {
        number: "01",
        icon: MousePointer,
        title: "Select Currency Pair",
        description:
            "Pick between 900 currencies you want to swap and tap the exchange button",
    },
    {
        number: "02",
        icon: Send,
        title: "Deposit Your Crypto",
        description:
            "Send crypto to the generated address and confirm where to receive the new currency",
    },
    {
        number: "03",
        icon: Wallet,
        title: "Receive Your New Crypto",
        description:
            "Receive the currency you requested with the best possible rates",
    },
];

export function HowItWorksSection() {
    return (
        <section id="how-it-works" className="py-20 md:py-32 bg-secondary/20">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Fast and Secure Way to{" "}
                        <span className="gradient-text">Exchange</span> Crypto
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        Exchange in 3 simple steps
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {steps.map((step, index) => (
                        <div
                            key={index}
                            className="relative group"
                        >
                            {/* Connector Line */}
                            {index < steps.length - 1 && (
                                <div className="hidden md:block absolute top-16 left-[calc(50%+3rem)] w-[calc(100%-6rem)] h-0.5 bg-gradient-to-r from-primary/50 to-primary/20"></div>
                            )}

                            <div className="glass rounded-2xl p-8 text-center hover:scale-105 transition-all duration-300 relative z-10">
                                {/* Step Number */}
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-5xl font-bold text-primary/10">
                                    {step.number}
                                </div>

                                {/* Icon */}
                                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center mb-6 shadow-lg shadow-amber-500/25 group-hover:shadow-amber-500/40 transition-all duration-300">
                                    <step.icon className="w-8 h-8 text-white" />
                                </div>

                                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
