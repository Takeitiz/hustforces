import {Link} from "react-router-dom";
import Logo from "../../../assets/hustforces.png";
import Playstore from "../../../assets/playstore.png";
import { SiInstagram, SiYoutube, SiX } from "@icons-pack/react-simple-icons";

export function Footer() {
    return (
<div className="bottom-0 w-full p-4 bg-gray-900 dark:bg-slate-900 px-6 lg:px-36 print:hidden">
    <div className="md:max-w-screen-2xl mt-4 mx-auto flex flex-row items-start justify-between w-full">
        <div className="flex flex-col md:flex-row w-3/5 md:justify-between">
            <div className="ml-21">
                <a href="/" target="_blank" rel="noopener noreferrer">
                    <img src={Logo} alt="Logo" width={300} height={200} className="hover:opacity-80"/>
                </a>
            </div>

            <div className="flex flex-col justify-center my-8 md:my-0">
                <h3 className="font-semibold text-neutral-100 mb-4">Quick Links</h3>
                <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-500 text-neutral-200">
                    Hustforces
                </a>
                <a
                    href="https://github.com/Takeitiz/hustforces"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-500 text-neutral-200"
                >
                    GitHub
                </a>
                <Link to="tnc" className="hover:text-blue-500 text-neutral-200">
                    Terms & Conditions
                </Link>
                <Link to="/privacy-policy" className="hover:text-blue-500 text-neutral-200">
                    Privacy Policy
                </Link>
            </div>
        </div>

        <div className="flex flex-col justify-center">
            <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-500 font-semibold text-neutral-200 mb-4"
            >
                Download App
                <img
                    className="shadow-md mt-2"
                    src={Playstore}
                    alt="playstore"
                    height={50}
                    width={150}
                />
            </a>
            <div>
                <h4 className="text-neutral-200 font-semibold mb-2">Follow us</h4>
                <div className="flex gap-x-2">
                    <a target="_blank" rel="noopener noreferrer" href="/">
                        <SiX className="text-white hover:text-blue-500" />
                    </a>
                    <a target="_blank" rel="noopener noreferrer" href="/">
                        <SiInstagram className="text-white hover:text-blue-500" />
                    </a>
                    <a target="_blank" rel="noopener noreferrer" href="/">
                        <SiYoutube className="text-white hover:text-blue-500" />
                    </a>
                </div>
            </div>
        </div>
    </div>
</div>
    )
}