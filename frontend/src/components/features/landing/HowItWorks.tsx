import { useEffect, useState } from "react"

export function HowItWorks() {
    const steps = [
        {
            heading: "Sign Up or Log In",
            description:
                "Create your account by signing up with your email, Google, or GitHub. If you are already a member, simply log in to access your profile and start coding right away.",
        },
        {
            heading: "Choose a Contest or Problem",
            description:
                "Explore our regularly scheduled coding contests and select one that fits your skill level or interests. Alternatively, dive into our extensive problem library to tackle challenges at your own pace.",
        },
        {
            heading: "Start Coding",
            description:
                "Use our interactive coding environment to write, test, and submit your solutions directly on the platform. Receive instant feedback to refine your approach.",
        },
        {
            heading: "Track Your Progress",
            description:
                "Monitor your ranking on real-time leaderboards and analyze your performance with detailed analytics. This insight helps you understand your strengths and pinpoint areas for improvement.",
        },
    ]

    const [visibleItems, setVisibleItems] = useState<number[]>([])

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const id = Number(entry.target.getAttribute("data-id"))
                        setVisibleItems((prev) => [...prev, id])
                    }
                })
            },
            { threshold: 0.1, rootMargin: "0px 0px -100px 0px" },
        )

        document.querySelectorAll(".step-card").forEach((card) => {
            observer.observe(card)
        })

        return () => observer.disconnect()
    }, [])

    return (
        <section className="py-16 md:py-24">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="flex flex-col items-center text-center gap-6 mb-16">
                    <div className="inline-flex px-4 py-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-700 dark:text-blue-300 text-sm font-medium">
                        Getting Started
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                        How it{" "}
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500">Works?</span>
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl">
                        Follow these simple steps to get started, compete in challenges, and track your progress on Hustforces.
                    </p>
                </div>

                <div className="relative">
                    {/* Connection line */}
                    <div className="absolute left-[50%] top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 to-indigo-500 hidden md:block"></div>

                    <div className="space-y-12 relative">
                        {steps.map((step, index) => (
                            <div
                                key={index}
                                data-id={index}
                                className={`step-card transition-all duration-700 delay-${index * 100} transform ${visibleItems.includes(index) ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
                            >
                                <div
                                    className={`flex flex-col md:flex-row gap-8 items-center ${index % 2 === 1 ? "md:flex-row-reverse" : ""}`}
                                >
                                    <div className="md:w-1/2 relative">
                                        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 relative z-10">
                                            <div className="inline-flex h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 items-center justify-center text-lg font-bold mb-4">
                                                {index + 1}
                                            </div>
                                            <h3 className="text-xl font-bold mb-3">{step.heading}</h3>
                                            <p className="text-gray-600 dark:text-gray-300">{step.description}</p>
                                        </div>
                                        {/* Connector dot for desktop */}
                                        <div
                                            className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 z-20 hidden md:block
                                            ${index % 2 === 0 ? 'right-0 translate-x-1/2' : 'left-0 -translate-x-1/2'}"
                                        ></div>
                                    </div>
                                    <div className="md:w-1/2 flex justify-center">
                                        <div className="w-64 h-64 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full flex items-center justify-center">
                                            <div className="text-6xl">{["🚀", "🔍", "💻", "📈"][index]}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

