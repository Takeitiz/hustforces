export function LanguageSectionLanding() {
    const languages=['C.svg','C++.svg','Csharp.svg','Go.svg','Java.svg','JS.svg','Php.svg','Ruby.svg'];
    return (
        <section className="bg-white dark:bg-gray-900 bg-gradient-to-t dark:from-[#020817] dark:to-[#0F172A] mx-4 md:mx-0 py-10 md:py-16">
            <div className="flex flex-col items-center text-center gap-4">
                <div className="text-5xl font-bold">
                    Supported <span className="text-[#4E7AFF]">Languages</span>
                </div>
                <div className="text-sm text-gray-500 w-full md:w-1/3">
                    Solve problems in your preferred language with Hustforces, offering a wide range of programming language options.
                </div>
                <div className="flex flex-wrap justify-center gap-2 bg-gray-100 dark:bg-black rounded-md p-2">
                    {languages.map((lang, index) => (
                        <img
                            key={index}
                            src={`../../../../public/languagesIcon/${lang}`}
                            alt={`${lang.replace('.svg', '')} programming language`}
                            className="h-12 w-12 object-contain"
                        />
                    ))}
                </div>
                <div>& Many More</div>
            </div>
        </section>
    )
}
