"use client";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
    {
        question: "What is a decentralized exchange (DEX)?",
        answer:
            "A decentralized exchange (DEX) is a platform that allows users to trade cryptocurrencies directly with each other without the need for a centralized intermediary like a traditional exchange. DEXs enable peer-to-peer trading while maintaining user control of their funds. We do not take custody of your funds.",
    },
    {
        question: "Do I need to create an account?",
        answer:
            "No, you do not need to create an account. This allows our clients to avoid identification or financial theft. Simply enter the details of your exchange and you're good to go!",
    },
    {
        question: "How fast will my transaction be processed?",
        answer:
            "Average exchange time is within 5 minutes. It ranges between 2 minutes to 20 minutes depending on the speed of the blockchain you are swapping to.",
    },
    {
        question: "What is a recipient wallet address?",
        answer:
            "This is your crypto wallet that we will send the requested funds to. You can find your crypto receive address in your crypto wallet. Make sure to double-check the address before confirming.",
    },
    {
        question: "How do I get my cryptocurrency wallet address?",
        answer:
            "Once you pick the cryptocurrency you want, look for a trustworthy wallet. Each crypto has an official wallet. When you make a wallet, you'll get an address and a private key. Always keep your private key secret and never share it, even if they ask for it. For safety, we'll never request your private keys, and no one else should either.",
    },
    {
        question: "What is the minimal or maximum exchange amount?",
        answer:
            "There is no maximum limit, however there is a minimum: which is different for each coin and ranges from ~$2 to $20. The system will tell you if you have not entered the minimum amount.",
    },
];

export function FAQSection() {
    return (
        <section id="faq" className="py-20 md:py-32">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Frequently Asked{" "}
                        <span className="gradient-text">Questions</span>
                    </h2>
                    <p className="text-muted-foreground">
                        We hope this FAQ list will help answer some common questions.
                    </p>
                </div>

                <div className="max-w-3xl mx-auto">
                    <Accordion type="single" collapsible className="w-full">
                        {faqs.map((faq, index) => (
                            <AccordionItem key={index} value={`item-${index}`}>
                                <AccordionTrigger className="text-left text-base md:text-lg">
                                    {index + 1}. {faq.question}
                                </AccordionTrigger>
                                <AccordionContent className="text-base leading-relaxed">
                                    {faq.answer}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </div>
        </section>
    );
}
