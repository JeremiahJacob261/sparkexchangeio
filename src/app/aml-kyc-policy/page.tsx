import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function AMLKYCPolicy() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />
            <main className="container mx-auto px-4 pt-32 pb-20 max-w-4xl">
                <h1 className="text-4xl font-bold mb-4 gradient-text">AML & KYC Policy (Limited)</h1>
                <p className="text-muted-foreground mb-8">Effective Date: January 14, 2026</p>

                <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground leading-relaxed">
                    <p>
                        SparkExchange operates a non-custodial model. We rely on ChangeNOW’s compliance tools for transaction monitoring.
                    </p>

                    <p>
                        We reserve the right to refuse service or cooperate with lawful authorities.
                    </p>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">Transaction Monitoring:</h2>
                        <p>
                            While we do not store your funds, we and our partners monitor transactions for suspicious activity
                            to prevent money laundering and terrorist financing.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">Compliance:</h2>
                        <p>
                            In certain cases, transaction partners like ChangeNOW may require identity verification (KYC) for
                            specific transactions as part of their regulatory compliance.
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
