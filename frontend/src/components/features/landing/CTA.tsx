import { Link } from "react-router-dom"
import { useEffect, useState } from "react"
import { ArrowRight } from "lucide-react"

export function CTA() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true)
                    observer.disconnect()
                }
            },
            { threshold: 0.1 },
        )

        const element = document.getElementById("cta-section")
        if (element) observer.observe(element)

        return () => observer.disconnect()
    }, [])

    return (
        <section id="cta-section" className="py-16 md:py-24">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div
                    className={`relative overflow-hidden transition-all duration-1000 transform ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 blur-3xl rounded-3xl"></div>

                    <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl overflow-hidden">
                        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]"></div>

                        <div className="relative flex flex-col md:flex-row p-8 md:p-12 items-center">
                            <div className="flex flex-col w-full md:w-2/3 text-start items-start gap-6 z-10">
                                <h2 className="text-3xl md:text-4xl font-bold text-white">
                                    Ready to Elevate Your <span className="text-blue-200">Coding Skills?</span>
                                </h2>
                                <p className="text-white/80 text-lg">
                                    Dive into a world of challenging contests, extensive problem libraries, and real-time leaderboards.
                                    Whether you're aiming to sharpen your skills or compete against the best, Hustforces is your platform
                                    for growth and achievement.
                                </p>
                                <Link to="/problems">
                                    <button className="px-6 py-3 mt-4 bg-white text-blue-600 font-medium rounded-lg shadow-lg hover:shadow-white/20 transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-2 group">
                                        Join Now
                                        <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                                    </button>
                                </Link>
                            </div>

                            <div className="flex grow h-60 md:h-auto mt-8 md:mt-0 relative">
                                <img className="absolute right-0 bottom-0 max-w-full h-auto" src="/A2.svg" alt="Hustforces logo" />
                            </div>
                        </div>

                        {/* Decorative elements */}
                        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl"></div>
                    </div>
                </div>
            </div>
        </section>
    )
}

