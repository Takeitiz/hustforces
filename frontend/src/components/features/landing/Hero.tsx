import HeroSectionLightImages from "../../../assets/HeroSectionLightImage.svg";
import HeroSectionDarkImages from "../../../assets/HeroSectionDarkImage.svg";

export function Hero() {
    return (
        <section className="bg-white dark:bg-[#020817] m-4 md:m-0 py-4 md:py-6">
            <div className="mx-auto px-4 md:px-6 flex flex-col justify-center items-center gap-0">
                <div className="flex flex-col justify-center text-center gap-3">
                    <div className="text-6xl font-bold">Conquer the Code at</div>
                    <div className="text-6xl text-[#4E7AFF] font-bold">Hustforces</div>
                    <div className="text-sm text-gray-600">Join elite coders, solve problem, and climb leaderboards at Hustforces </div>
                    <div className="flex flex-col md:flex-row justify-center gap-4 mt-4">
                        <button
                            className="border-[1px] border-gray-600 px-4 py-2 rounded-sm bg-[#4E7AFF]"
                            onClick={() => console.log("Hello World!")}
                        >
                            Start Solving
                        </button>
                        <button className="border-[1px] border-gray-600 px-4 py-2 rounded-sm">Explore Features</button>
                    </div>
                </div>

                <div className="">
                    <img
                        className="block dark:hidden "
                        src={HeroSectionLightImages}
                        alt="Light mode hero image"
                    />
                    <img
                        className="hidden dark:block "
                        src={HeroSectionDarkImages}
                        alt="Dark mode hero image"
                    />
                </div>
            </div>
        </section>
    )
}