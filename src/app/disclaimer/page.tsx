import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function Disclaimer() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <Header />
            <main className="container mx-auto px-4 pt-32 pb-20 max-w-4xl">
                <h1 className="text-4xl font-bold mb-4 gradient-text">Disclaimer</h1>
                <p className="text-muted-foreground mb-8">Effective Date: January 14, 2026</p>

                <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground leading-relaxed">
                    <p className="text-xl font-medium text-foreground">
                        SparkExchange does not provide financial, legal, or investment advice. Use of this platform is at your own risk.
                    </p>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">No Warranties:</h2>
                        <p>
                            The platform is provided on an "as-is" and "as-available" basis. We make no representations or warranties
                            of any kind regarding the operation of the service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">Third-Party Content:</h2>
                        <p>
                            Our platform may contain links to or integrations with third-party services. We are not responsible for
                            the content or practices of these third parties.
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
