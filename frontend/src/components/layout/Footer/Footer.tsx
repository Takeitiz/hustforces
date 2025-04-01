import { Link } from "react-router-dom"
import Playstore from "../../../assets/playstore.png"
import { SiInstagram, SiYoutube, SiX, SiGithub } from "@icons-pack/react-simple-icons"
import { Logo } from "../../ui/Logo.tsx"

export function Footer() {
    return (
        <footer className="bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-[#0F172A] pt-16 pb-8 print:hidden">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                {/* Top section with main content */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">
                    {/* Logo and description */}
                    <div className="col-span-1 lg:col-span-2">
                        <Logo size="large" variant="footer" />
                        <p className="mt-4 text-gray-600 dark:text-gray-300 max-w-md">
                            Hustforces is a competitive programming platform designed to help coders improve their skills through
                            challenges, contests, and a supportive community.
                        </p>
                        <div className="mt-6 flex space-x-4">
                            <a
                                href="https://github.com/Takeitiz/hustforces"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300"
                                aria-label="GitHub"
                            >
                                <SiGithub className="w-5 h-5" />
                            </a>
                            <a
                                href="/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300"
                                aria-label="Twitter/X"
                            >
                                <SiX className="w-5 h-5" />
                            </a>
                            <a
                                href="/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300"
                                aria-label="Instagram"
                            >
                                <SiInstagram className="w-5 h-5" />
                            </a>
                            <a
                                href="/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300"
                                aria-label="YouTube"
                            >
                                <SiYoutube className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Quick Links</h3>
                        <ul className="space-y-3">
                            <li>
                                <Link
                                    to="/problems"
                                    className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300"
                                >
                                    Problems
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/contests"
                                    className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300"
                                >
                                    Contests
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/standings"
                                    className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300"
                                >
                                    Standings
                                </Link>
                            </li>
                            <li>
                                <a
                                    href="https://github.com/Takeitiz/hustforces"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300"
                                >
                                    GitHub
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Legal & Download */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Legal & Download</h3>
                        <ul className="space-y-3 mb-6">
                            <li>
                                <Link
                                    to="/tnc"
                                    className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300"
                                >
                                    Terms & Conditions
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/privacy-policy"
                                    className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300"
                                >
                                    Privacy Policy
                                </Link>
                            </li>
                        </ul>

                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Download App</h3>
                        <a
                            href="/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block hover:opacity-90 transition-opacity duration-300"
                        >
                            <img
                                className="shadow-md rounded-md"
                                src={Playstore || "/placeholder.svg"}
                                alt="Download on Google Play Store"
                                height={50}
                                width={150}
                            />
                        </a>
                    </div>
                </div>

                {/* Bottom section with copyright */}
                <div className="pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 md:mb-0">
                        &copy; {new Date().getFullYear()} Hustforces. All rights reserved.
                    </p>
                    <div className="flex space-x-6">
                        <Link
                            to="/contact"
                            className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300"
                        >
                            Contact
                        </Link>
                        <Link
                            to="/faq"
                            className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300"
                        >
                            FAQ
                        </Link>
                        <Link
                            to="/support"
                            className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300"
                        >
                            Support
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}

