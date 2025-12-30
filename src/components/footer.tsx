import Link from "next/link";
import Image from "next/image";
import { Twitter, Github, MessageCircle } from "lucide-react";

export function Footer() {
    return (
        <footer className="bg-secondary/30 border-t border-border/50">
            <div className="container mx-auto px-4 py-12 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
                    {/* Brand */}
                    <div className="md:col-span-1">
                        <Link href="/" className="flex items-center gap-2 group mb-4">
                            <Image
                                src="/favicon.jpg"
                                alt="Spark Exchange Logo"
                                width={40}
                                height={40}
                                className="rounded-xl shadow-lg shadow-amber-500/25"
                            />
                            <span className="text-xl font-bold gradient-text">
                                Spark Exchange
                            </span>
                        </Link>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Simple, Fast and Custody-Free Exchange. Swap between 900+ cryptocurrencies securely.
                        </p>
                        {/* Social Icons */}
                        <div className="flex gap-4 mt-6">
                            <a
                                href="https://x.com/SparkExchangeDX"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                            >
                                <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 fill-current">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                            </a>

                            {/* <a
                                href="#"
                                className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                            >
                                <Github className="w-5 h-5" />
                            </a>
                            <a
                                href="#"
                                className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                            >
                                <MessageCircle className="w-5 h-5" />
                            </a> */}
                        </div>
                    </div>

                    {/* About Links */}
                    <div>
                        <h4 className="font-semibold mb-4">About</h4>
                        <ul className="space-y-3">
                            <li>
                                <Link
                                    href="#about"
                                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                >
                                    About us
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="#contact"
                                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                >
                                    Contact us
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="#faq"
                                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                >
                                    FAQ
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Products Links */}
                    {/* <div>
                        <h4 className="font-semibold mb-4">Products</h4>
                        <ul className="space-y-3">
                            <li>
                                <Link
                                    href="#exchange"
                                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                >
                                    Exchange
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="#"
                                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                >
                                    API
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="#"
                                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                >
                                    Widget
                                </Link>
                            </li>
                        </ul>
                    </div> */}

                    {/* Resources Links */}
                    <div>
                        <h4 className="font-semibold mb-4">Resources</h4>
                        <ul className="space-y-3">
                            <li>
                                <Link
                                    href="#faq"
                                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                >
                                    FAQ
                                </Link>
                            </li>
                            {/* <li>
                                <Link
                                    href="#"
                                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                >
                                    Blog
                                </Link>
                            </li> */}
                            <li>
                                <Link
                                    href="#"
                                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                                >
                                    Support
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-border/50 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-muted-foreground">
                        © 2024 Spark Exchange. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <Link
                            href="#"
                            className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                            Privacy Policy
                        </Link>
                        <Link
                            href="#"
                            className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
