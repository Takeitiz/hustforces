import { useEffect, useState } from "react"
import { CheckCircle } from "lucide-react"

export function Features() {
    const features = [
        {
            heading: "Competitive Coding Contests",
            description:
                "Participate in challenging coding contests regularly, testing your skills against the best. Improve your problem-solving abilities and climb the leaderboards with each competition.",
            icon: "🏆",
        },
        {
            heading: "Real-Time Leaderboards",
            description:
                "Track your progress with dynamic leaderboards that update in real-time. See where you stand in the global coding community and strive to improve your rank.",
            icon: "📊",
        },
        {
            heading: "Vast Problem Library",
            description:
                "Access a diverse collection of coding problems across various topics and difficulty levels. Challenge yourself with beginner to expert-level tasks and enhance your coding skills.",
            icon: "📚",
        },
        {
            heading: "Detailed Problem Descriptions",
            description:
                "Each problem comes with clear and comprehensive descriptions, including input/output examples. Understand the task at hand and approach each problem with confidence.",
            icon: "📝",
        },
        {
            heading: "Seamless Coding",
            description:
                "Code directly on the platform with our interactive coding environment. Write, test, and submit your solutions seamlessly without needing any external tools.",
            icon: "💻",
        },
        {
            heading: "Multilingual Support",
            description:
                "Solve problems using your preferred programming language. Our platform supports multiple languages, allowing you to code comfortably in the language you excel at.",
            icon: "🌐",
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

        document.querySelectorAll(".feature-card").forEach((card) => {
            observer.observe(card)
        })

        return () => observer.disconnect()
    }, [])

    return (
        <section
            id="features"
            className="py-16 md:py-24 bg-gradient-to-b from-white to-blue-50 dark:from-[#020817] dark:to-[#0F172A]"
        >
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="flex flex-col items-center text-center gap-6 mb-16">
                    <div className="inline-flex px-4 py-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-700 dark:text-blue-300 text-sm font-medium">
                        Why Choose Hustforces
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                        Platform{" "}
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500">Features</span>
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl">
                        Unlock the Full Potential of Competitive Programming with These Key Features
                    </p>
                </div>

                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            data-id={index}
                            className={`feature-card bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 transition-all duration-700 transform ${visibleItems.includes(index) ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
                        >
                            <div className="flex flex-col h-full">
                                <div className="mb-4 text-4xl">{feature.icon}</div>
                                <h3 className="text-xl font-bold mb-3">{feature.heading}</h3>
                                <p className="text-gray-600 dark:text-gray-300 flex-grow">{feature.description}</p>
                                <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400">
                                    <CheckCircle className="w-5 h-5 mr-2" />
                                    <span className="text-sm font-medium">Included in all plans</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

