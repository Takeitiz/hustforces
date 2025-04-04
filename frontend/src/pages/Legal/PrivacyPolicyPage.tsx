import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export function PrivacyPolicyPage() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center mb-6">
                <Link to="/" className="flex items-center text-blue-600 dark:text-blue-400 hover:underline">
                    <ArrowLeft size={18} className="mr-1" />
                    Back to Home
                </Link>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
                <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-8">Last updated: April 1, 2025</p>

                <div className="prose prose-blue dark:prose-invert max-w-none">
                    <h2>1. Introduction</h2>
                    <p>
                        Welcome to Hustforces! This Privacy Policy explains how we collect, use, disclose, and safeguard your information
                        when you visit our website and use our services. Please read this Privacy Policy carefully. By continuing to use our Service,
                        you acknowledge that you have read and understood this Privacy Policy.
                    </p>

                    <h2>2. Information We Collect</h2>
                    <h3>2.1 Personal Information</h3>
                    <p>
                        We may collect personally identifiable information, such as:
                    </p>
                    <ul>
                        <li>Your name</li>
                        <li>Email address</li>
                        <li>Username</li>
                        <li>Profile picture</li>
                        <li>Password (stored in encrypted form)</li>
                    </ul>

                    <h3>2.2 Usage Data</h3>
                    <p>
                        We may also collect information about how the Service is accessed and used ("Usage Data"). This Usage Data may include:
                    </p>
                    <ul>
                        <li>Your computer's Internet Protocol (IP) address</li>
                        <li>Browser type and version</li>
                        <li>Pages of our Service that you visit</li>
                        <li>Time and date of your visit</li>
                        <li>Time spent on those pages</li>
                        <li>Unique device identifiers</li>
                        <li>Other diagnostic data</li>
                    </ul>

                    <h3>2.3 Tracking & Cookies Data</h3>
                    <p>
                        We use cookies and similar tracking technologies to track activity on our Service and hold certain information.
                        Cookies are files with a small amount of data that may include an anonymous unique identifier.
                    </p>
                    <p>
                        You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies,
                        you may not be able to use some portions of our Service.
                    </p>

                    <h2>3. How We Use Your Information</h2>
                    <p>
                        We use the collected data for various purposes:
                    </p>
                    <ul>
                        <li>To provide and maintain our Service</li>
                        <li>To notify you about changes to our Service</li>
                        <li>To allow you to participate in interactive features of our Service when you choose to do so</li>
                        <li>To provide customer support</li>
                        <li>To gather analysis or valuable information so that we can improve our Service</li>
                        <li>To monitor the usage of our Service</li>
                        <li>To detect, prevent and address technical issues</li>
                        <li>To personalize your experience</li>
                    </ul>

                    <h2>4. Information Sharing and Disclosure</h2>
                    <h3>4.1 Legal Requirements</h3>
                    <p>
                        We may disclose your Personal Information in the good faith belief that such action is necessary to:
                    </p>
                    <ul>
                        <li>Comply with a legal obligation</li>
                        <li>Protect and defend the rights or property of Hustforces</li>
                        <li>Prevent or investigate possible wrongdoing in connection with the Service</li>
                        <li>Protect the personal safety of users of the Service or the public</li>
                        <li>Protect against legal liability</li>
                    </ul>

                    <h3>4.2 Service Providers</h3>
                    <p>
                        We may employ third-party companies and individuals to facilitate our Service ("Service Providers"), to provide the Service on our behalf,
                        to perform Service-related services, or to assist us in analyzing how our Service is used.
                    </p>
                    <p>
                        These third parties have access to your Personal Information only to perform these tasks on our behalf and are obligated
                        not to disclose or use it for any other purpose.
                    </p>

                    <h3>4.3 Analytics</h3>
                    <p>
                        We may use third-party Service Providers to monitor and analyze the use of our Service.
                    </p>
                    <ul>
                        <li>
                            <strong>Google Analytics:</strong> Google Analytics is a web analytics service offered by Google that tracks
                            and reports website traffic. Google uses the data collected to track and monitor the use of our Service.
                            This data is shared with other Google services. For more information on the privacy practices of Google,
                            please visit the Google Privacy & Terms web page.
                        </li>
                    </ul>

                    <h2>5. Data Security</h2>
                    <p>
                        The security of your data is important to us, but remember that no method of transmission over the Internet,
                        or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect
                        your Personal Information, we cannot guarantee its absolute security.
                    </p>

                    <h2>6. Your Data Protection Rights</h2>
                    <p>
                        You have certain data protection rights. If you wish to be informed what Personal Information we hold about you
                        and if you want it to be removed from our systems, please contact us.
                    </p>
                    <p>
                        In certain circumstances, you have the following data protection rights:
                    </p>
                    <ul>
                        <li><strong>The right to access, update or to delete</strong> the information we have on you.</li>
                        <li><strong>The right of rectification.</strong> You have the right to have your information rectified if that information is inaccurate or incomplete.</li>
                        <li><strong>The right to object.</strong> You have the right to object to our processing of your Personal Information.</li>
                        <li><strong>The right of restriction.</strong> You have the right to request that we restrict the processing of your personal information.</li>
                        <li><strong>The right to data portability.</strong> You have the right to be provided with a copy of the information we have on you in a structured, machine-readable and commonly used format.</li>
                        <li><strong>The right to withdraw consent.</strong> You also have the right to withdraw your consent at any time where we relied on your consent to process your personal information.</li>
                    </ul>

                    <h2>7. Children's Privacy</h2>
                    <p>
                        Our Service does not address anyone under the age of 13. We do not knowingly collect personally identifiable information
                        from anyone under the age of 13. If you are a parent or guardian and you are aware that your child has provided us with
                        Personal Information, please contact us. If we become aware that we have collected Personal Information from children
                        without verification of parental consent, we take steps to remove that information from our servers.
                    </p>

                    <h2>8. Changes to This Privacy Policy</h2>
                    <p>
                        We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
                    </p>
                    <p>
                        You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy
                        are effective when they are posted on this page.
                    </p>

                    <h2>9. International Transfers</h2>
                    <p>
                        Your information, including Personal Information, may be transferred to — and maintained on — computers located outside of your state,
                        province, country or other governmental jurisdiction where the data protection laws may differ from those of your jurisdiction.
                    </p>
                    <p>
                        Your consent to this Privacy Policy followed by your submission of such information represents your agreement to that transfer.
                    </p>

                    <h2>10. Contact Us</h2>
                    <p>
                        If you have any questions about this Privacy Policy, please contact us:
                    </p>
                    <p>
                        <strong>Email:</strong> privacy@hustforces.com<br/>
                        <strong>Address:</strong> 123 Coding Street, Tech City, 10001
                    </p>

                    <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-center text-gray-500 dark:text-gray-400">
                            By using Hustforces, you agree to the collection and use of information in accordance with this Privacy Policy.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}