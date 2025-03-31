import { Link } from 'react-router-dom';

export function CTA() {
    return (
        <section className="bg-white dark:bg-[#020817] py-6 md:py-10">
            <div className="flex flex-col md:flex-row p-4 relative items-center m-auto text-center gap-4 max-w-[1024px] border-[1px] rounded-xl bg-gradient-to-t from-[] to-[#a4a3a3] dark:from-[#020817] dark:to-[#0F172A]">
                <div className="flex flex-col w-full md:w-1/2 text-start items-start gap-4 m-4">
                    <div className="text-xl font-bold">
                        Ready to Elevate Your <span className="text-blue-200">Coding Skills?</span>
                    </div>
                    <div className="text-gray-600 dark:text-gray-300">
                        Dive into a world of challenging contests, extensive problem libraries, and real-time leaderboards. Whether you're aiming to sharpen your skills or compete against the best, Hustforces is your platform for growth and achievement.
                    </div>
                    <Link to="/problems">
                        <button className="p-2 w-full md:w-auto border-[1px] rounded-md bg-[#4E7AFF] text-white hover:bg-[#3A66E0] transition-colors">
                            Join Now
                        </button>
                    </Link>
                </div>
                <div className="flex grow h-60 md:h-auto"></div>
                <img className="absolute right-0 bottom-0" src="/A2.svg" alt="Hustforces logo" />
            </div>
        </section>
    );
}