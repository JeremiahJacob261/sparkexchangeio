import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function RiskDisclosure() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />
            <main className="container mx-auto px-4 pt-32 pb-20 max-w-4xl">
                <h1 className="text-4xl font-bold mb-4 gradient-text">Risk Disclosure</h1>
                <p className="text-muted-foreground mb-8">Effective Date: January 14, 2026</p>

                <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground leading-relaxed">
                    <p className="border-l-4 border-amber-500 pl-4 py-2 bg-amber-500/10 rounded-r-lg">
                        Cryptocurrency trading is highly volatile and risky. Users may lose all funds involved in a transaction.
                        Blockchain transactions are irreversible.
                    </p>

                    <p>
                        Only transact what you can afford to lose.
                    </p>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">Volatility:</h2>
                        <p>
                            The price of cryptocurrencies can change rapidly. SparkExchange is not responsible for price fluctuations
                            during the swap process.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">Technical Risks:</h2>
                        <p>
                            Using blockchain technology involves risks such as software bugs, network congestion, and potential
                            vulnerabilities in smart contracts or exchange protocols.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">Contact:</h2>
                        <p>
                            If you have any questions, please contact us at{" "}
                            <a href="mailto:sparkexchangedex@gmail.com" className="text-primary hover:underline">
                                sparkexchangedex@gmail.com
                            </a>
                        </p>
                    </section>
                </div>
            </main>
            <Footer />
        </div>
    );
}
