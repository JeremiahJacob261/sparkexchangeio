"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navigation = [
    { href: "/", label: "Home" },
    { href: "/iptv", label: "IPTV" },
    { href: "/exchange", label: "Exchange" },
];

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        if (!isMenuOpen) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setIsMenuOpen(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isMenuOpen]);

    return (
        <header className="fixed inset-x-0 top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur-lg">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between gap-6 md:h-20">
                    <Link href="/" onClick={() => setIsMenuOpen(false)} className="flex shrink-0 items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary" aria-label="PlasmaX home">
                        <Image src="/assets/plasmax-mark.svg" alt="" width={40} height={40} className="rounded-xl" />
                        <span className="text-base font-bold tracking-tight sm:text-lg">PlasmaX</span>
                    </Link>

                    <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
                        {navigation.map(item => (
                            <a key={item.href} href={item.href} className="rounded-lg px-3 py-3 text-sm font-medium text-foreground/75 transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{item.label}</a>
                        ))}
                    </nav>

                    <div className="hidden lg:block">
                        <Button variant="gradient" size="lg" asChild><Link href="/exchange#exchange">Start Exchange</Link></Button>
                    </div>
                    <button type="button" className="flex min-h-11 min-w-11 items-center justify-center rounded-lg transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:hidden" aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={isMenuOpen} aria-controls="mobile-navigation" onClick={() => setIsMenuOpen(open => !open)}>
                        {isMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
                    </button>
                </div>
            </div>
            {isMenuOpen && (
                <nav id="mobile-navigation" aria-label="Mobile navigation" className="absolute inset-x-0 top-full max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-border bg-background px-4 pb-6 pt-2 shadow-xl lg:hidden">
                    <div className="container mx-auto flex flex-col">
                        {navigation.map(item => (
                            <a key={item.href} href={item.href} onClick={() => setIsMenuOpen(false)} className="rounded-lg px-3 py-3 text-base font-medium text-foreground/85 hover:bg-secondary focus-visible:outline-2 focus-visible:outline-primary">{item.label}</a>
                        ))}
                        <Button variant="gradient" size="lg" className="mt-3" asChild><Link href="/exchange#exchange" onClick={() => setIsMenuOpen(false)}>Start Exchange</Link></Button>
                        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 border-t border-border pt-5 text-sm text-muted-foreground">
                            <Link href="/privacy-policy" onClick={() => setIsMenuOpen(false)} className="hover:text-foreground">Privacy Policy</Link>
                            <Link href="/terms-and-conditions" onClick={() => setIsMenuOpen(false)} className="hover:text-foreground">Terms &amp; Conditions</Link>
                        </div>
                    </div>
                </nav>
            )}
        </header>
    );
}

