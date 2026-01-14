import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function TermsAndConditions() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />
            <main className="container mx-auto px-4 pt-32 pb-20 max-w-4xl">
                <h1 className="text-4xl font-bold mb-4 gradient-text">Terms and Conditions</h1>
                <p className="text-muted-foreground mb-8">Effective Date: January 14, 2026</p>

                <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground leading-relaxed">
                    <p>
                        By using SparkExchange, you agree to these Terms.
                    </p>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">Nature of Service:</h2>
                        <p>
                            SparkExchange is a non-custodial platform. We do not hold funds, control wallets, or provide financial advice.
                            All swaps are executed via ChangeNOW.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">Eligibility:</h2>
                        <p>
                            Users must be 18+ and legally permitted to use crypto services in their jurisdiction.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">User Responsibilities:</h2>
                        <p>
                            Users are responsible for correct wallet addresses and understanding blockchain transaction finality.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">Fees:</h2>
                        <p>
                            Rates and fees are determined by ChangeNOW and network conditions.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">Limitation of Liability:</h2>
                        <p>
                            SparkExchange is not liable for losses, failed transactions, incorrect addresses, or third-party issues.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">Governing Law:</h2>
                        <p>
                            To be determined by operating jurisdiction.
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
