import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import HeroSectionLightImages from "../../../assets/HeroSectionLightImage.svg"
import HeroSectionDarkImages from "../../../assets/HeroSectionDarkImage.svg"
import { ArrowRight } from "lucide-react"

export function Hero() {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        setIsVisible(true)
    }, [])

    return (
        <section className="bg-gradient-to-b from-white to-blue-50 dark:from-[#020817] dark:to-[#0F172A] py-16 md:py-24 overflow-hidden">
            <div className="mx-auto px-4 md:px-6 max-w-7xl flex flex-col justify-center items-center">
                <div
                    className={`flex flex-col justify-center text-center gap-6 transition-all duration-1000 transform ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
                >
                    <div className="inline-flex mx-auto px-4 py-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-700 dark:text-blue-300 text-sm font-medium mb-2">
                        Welcome to the future of competitive coding
                    </div>
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
                        Conquer the Code at{" "}
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500">
              Hustforces
            </span>
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                        Join elite coders, solve challenging problems, and climb leaderboards in a community dedicated to excellence
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4 mt-4">
                        <Link to="/problems">
                            <button className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-500 text-white font-medium shadow-lg hover:shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2 group">
                                Start Solving
                                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                            </button>
                        </Link>
                        <Link to="#features">
                            <button className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 font-medium">
                                Explore Features
                            </button>
                        </Link>
                    </div>
                </div>

                <div
                    className={`mt-12 md:mt-16 relative transition-all duration-1000 delay-300 transform ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
                >
                    <div className="relative z-0 rounded-xl overflow-hidden shadow-2xl">
                        <img
                            className="block dark:hidden max-w-full h-auto"
                            src={HeroSectionLightImages || "/placeholder.svg"}
                            alt="Light mode hero image"
                        />
                        <img
                            className="hidden dark:block max-w-full h-auto"
                            src={HeroSectionDarkImages || "/placeholder.svg"}
                            alt="Dark mode hero image"
                        />
                    </div>
                    <div className="absolute -inset-0 bg-blue-500/10 dark:bg-blue-500/5 blur-3xl rounded-full z-[-1]"></div>
                </div>
            </div>
        </section>
    )
}

