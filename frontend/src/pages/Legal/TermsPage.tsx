import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export function TermsPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center mb-6">
                <Link to="/" className="flex items-center text-blue-600 dark:text-blue-400 hover:underline">
                    <ArrowLeft size={18} className="mr-1" />
                    Back to Home
                </Link>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
                <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-8">Last updated: April 1, 2025</p>

                <div className="prose prose-blue dark:prose-invert max-w-none">
                    <h2>1. Introduction</h2>
                    <p>
                        Welcome to Hustforces! These Terms of Service ("Terms") govern your access to and use of the Hustforces website,
                        services, and applications (collectively, the "Service"). Please read these Terms carefully, as they constitute
                        a legal agreement between you and Hustforces.
                    </p>
                    <p>
                        By accessing or using the Service, you agree to be bound by these Terms. If you do not agree to all the terms
                        and conditions, then you may not access or use the Service.
                    </p>

                    <h2>2. Definitions</h2>
                    <p><strong>"We," "us," and "our"</strong> refer to Hustforces.</p>
                    <p><strong>"You" and "your"</strong> refer to the individual or entity using our Service.</p>
                    <p><strong>"Content"</strong> refers to any information, text, graphics, photos, or other materials uploaded, downloaded, or appearing on the Service.</p>
                    <p><strong>"User Content"</strong> refers to Content that users submit or transmit to, through, or in connection with the Service.</p>

                    <h2>3. Eligibility</h2>
                    <p>
                        You must be at least 13 years old to use the Service. By agreeing to these Terms, you represent and warrant that:
                    </p>
                    <ul>
                        <li>You are at least 13 years of age;</li>
                        <li>You have the right, authority, and capacity to enter into these Terms;</li>
                        <li>You will abide by all the terms and conditions of these Terms.</li>
                    </ul>

                    <h2>4. Account Registration</h2>
                    <p>
                        To access certain features of the Service, you may be required to register for an account. When you register, you
                        agree to provide accurate, current, and complete information and to update this information to maintain its accuracy.
                    </p>
                    <p>
                        You are responsible for maintaining the confidentiality of your account password and for all activities
                        that occur under your account. You must notify us immediately of any unauthorized use of your account.
                    </p>

                    <h2>5. Acceptable Use</h2>
                    <p>
                        You agree not to misuse the Service. Misuse includes, but is not limited to:
                    </p>
                    <ul>
                        <li>Using the Service for any unlawful purpose or in violation of any laws;</li>
                        <li>Posting or transmitting content that infringes upon someone else's intellectual property rights;</li>
                        <li>Posting or transmitting content that is harmful, offensive, obscene, abusive, invasive of privacy, or otherwise objectionable;</li>
                        <li>Attempting to compromise the security of the Service or gain unauthorized access to any part of the Service;</li>
                        <li>Impersonating another person or entity;</li>
                        <li>Engaging in any activity that interferes with or disrupts the Service;</li>
                        <li>Using any automated means to access, scrape, or extract data from the Service without our express permission.</li>
                    </ul>

                    <h2>6. User Content</h2>
                    <p>
                        By submitting User Content to the Service, you grant us a worldwide, non-exclusive, royalty-free license to use,
                        reproduce, modify, adapt, publish, translate, create derivative works from, distribute, and display such content
                        in any media, including for promoting Hustforces.
                    </p>
                    <p>
                        You represent and warrant that:
                    </p>
                    <ul>
                        <li>You own or have the necessary rights to the User Content you submit;</li>
                        <li>The User Content does not infringe on the intellectual property rights, privacy rights, or any other rights of any person or entity;</li>
                        <li>The User Content does not violate any laws or regulations.</li>
                    </ul>

                    <h2>7. Intellectual Property</h2>
                    <p>
                        All content, features, and functionality of the Service, including but not limited to text, graphics, logos, icons,
                        and software, are owned by Hustforces and are protected by copyright, trademark, and other intellectual property laws.
                    </p>
                    <p>
                        You may not copy, modify, distribute, sell, or lease any part of the Service without our explicit permission.
                    </p>

                    <h2>8. Privacy</h2>
                    <p>
                        Your privacy is important to us. Please review our <Link to="/privacy-policy" className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</Link>, which
                        explains how we collect, use, and disclose information about you.
                    </p>

                    <h2>9. Termination</h2>
                    <p>
                        We reserve the right to suspend or terminate your access to the Service at any time for any reason,
                        including but not limited to a violation of these Terms, without notice.
                    </p>

                    <h2>10. Disclaimer of Warranties</h2>
                    <p>
                        THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
                        TO THE FULLEST EXTENT PERMISSIBLE UNDER APPLICABLE LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING
                        IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                    </p>

                    <h2>11. Limitation of Liability</h2>
                    <p>
                        TO THE MAXIMUM EXTENT PERMITTED BY LAW, HUSTFORCES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
                        CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL, SERVICE INTERRUPTION, COMPUTER
                        DAMAGE OR SYSTEM FAILURE, ARISING OUT OF OR IN CONNECTION WITH THE USE OF THE SERVICE.
                    </p>

                    <h2>12. Changes to Terms</h2>
                    <p>
                        We may revise these Terms from time to time. The most current version will always be posted on the Service.
                        If a revision, in our sole discretion, is material, we will notify you via email or through the Service.
                        By continuing to access or use the Service after revisions become effective, you agree to be bound by the revised Terms.
                    </p>

                    <h2>13. Governing Law</h2>
                    <p>
                        These Terms shall be governed by and construed in accordance with the laws of [Jurisdiction], without regard to its
                        conflict of law principles.
                    </p>

                    <h2>14. Contact Information</h2>
                    <p>
                        If you have any questions about these Terms, please contact us at:
                    </p>
                    <p>
                        <strong>Email:</strong> support@hustforces.com<br/>
                        <strong>Address:</strong> 123 Coding Street, Tech City, 10001
                    </p>

                    <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-center text-gray-500 dark:text-gray-400">
                            By using Hustforces, you acknowledge that you have read these Terms of Service, understand them, and agree to be bound by them.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}