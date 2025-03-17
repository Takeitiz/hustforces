import {Hero} from "./Hero.tsx";
import {LanguageSectionLanding} from "./LanguageSectionLanding.tsx";
import {Features} from "./Features.tsx";
import {HowItWorks} from "./HowItWorks.tsx";
import {CTA} from "./CTA.tsx";

export function Landing() {
    return (
<div>
    <main>
        <Hero/>
        <LanguageSectionLanding/>
        <Features/>
        <HowItWorks/>
        <CTA/>
    </main>
</div>
    )
}