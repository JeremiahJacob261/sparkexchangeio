export function VideoSection() {
    return (
        <section className="py-20 md:py-32 bg-background">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-2xl mx-auto mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Watch{" "}
                        <span className="gradient-text">How to Swap</span>
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        See SparkExchange in action
                    </p>
                </div>

                <div className="max-w-5xl mx-auto">
                    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                        <iframe
                            src="https://player.vimeo.com/video/1153456052?title=0&amp;byline=0&amp;portrait=0&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479"

                            className="absolute top-0 left-0 w-full h-full rounded-2xl shadow-2xl"
                            frameBorder="0"
                            allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            title="HOW TO SWAP IN SPARKEXCHANGE.IO"
                        />


                    </div>
                </div>
            </div>
        </section>
    );
}
