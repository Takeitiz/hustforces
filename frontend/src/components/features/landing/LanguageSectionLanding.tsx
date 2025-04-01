import { useEffect, useState } from "react"

export function LanguageSectionLanding() {
    const languages = ["C.svg", "C++.svg", "Csharp.svg", "Go.svg", "Java.svg", "JS.svg", "Php.svg", "Ruby.svg"]

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

        const element = document.getElementById("language-section")
        if (element) observer.observe(element)

        return () => observer.disconnect()
    }, [])

    return (
        <section id="language-section" className="py-16 md:py-24">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div
                    className={`flex flex-col items-center text-center gap-6 transition-all duration-700 transform ${isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
                >
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                        Supported{" "}
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500">
              Languages
            </span>
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
                        Solve problems in your preferred language with Hustforces, offering a wide range of programming language
                        options.
                    </p>

                    <div className="w-full max-w-4xl mt-8">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 backdrop-blur-sm border border-gray-100 dark:border-gray-700">
                            <div className="grid grid-cols-4 md:grid-cols-8 gap-6 items-center justify-items-center">
                                {languages.map((lang, index) => (
                                    <div
                                        key={index}
                                        className={`transition-all duration-700 delay-${index * 100} transform ${isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-4 opacity-0 scale-95"}`}
                                    >
                                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-xl hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                                            <img
                                                src={`/languagesIcon/${lang}`}
                                                alt={`${lang.replace(".svg", "")} programming language`}
                                                className="h-12 w-12 object-contain"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-center mt-8 text-gray-500 dark:text-gray-400 font-medium">& Many More</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}

