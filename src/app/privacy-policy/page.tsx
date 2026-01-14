import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />
            <main className="container mx-auto px-4 pt-32 pb-20 max-w-4xl">
                <h1 className="text-4xl font-bold mb-4 gradient-text">Privacy Policy</h1>
                <p className="text-muted-foreground mb-8">Effective Date: January 14, 2026</p>

                <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground leading-relaxed">
                    <p>
                        SparkExchange (“we,” “our,” “us”) respects your privacy and is committed to protecting your personal data.
                        This Privacy Policy explains how we collect, use, and protect information when you use our platform.
                    </p>
                    <p>
                        SparkExchange operates as a non-custodial cryptocurrency exchange and facilitates swaps through third-party providers,
                        including ChangeNOW.
                    </p>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">Information We Collect:</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Email address (if provided)</li>
                            <li>Wallet addresses</li>
                            <li>Transaction metadata</li>
                            <li>IP address and device information</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">How We Use Information:</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Process crypto swaps</li>
                            <li>Prevent fraud and abuse</li>
                            <li>Improve platform performance</li>
                            <li>Comply with legal obligations</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">Third-Party Services:</h2>
                        <p>
                            SparkExchange integrates ChangeNOW and blockchain networks. Each third party operates under its own privacy policy.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">Data Security:</h2>
                        <p>
                            We apply industry-standard safeguards but cannot guarantee absolute security.
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
