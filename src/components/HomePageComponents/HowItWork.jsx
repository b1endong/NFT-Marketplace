import Work from "./Work";
import Heading from "./Heading";
import Icon from "/Icon.svg";
import Icon2 from "/Icon2.svg";
import Icon3 from "/Icon3.svg";
export default function HowItWork() {
    return (
        <div className="py-20">
            <Heading
                title="How It Works"
                subtitle="Find Out How To Get Started"
            />
            <div className="mt-15 flex-center-between gap-8">
                <Work
                    imgSrc={Icon}
                    title={"Setup Your Wallet"}
                    description={
                        "Set up your wallet of choice. Connect it to the Animarket by clicking the wallet icon in the top right corner."
                    }
                />
                <Work
                    imgSrc={Icon2}
                    title={"Create Collection"}
                    description={
                        "Upload your work and setup your collection. Add a description, social links and floor price."
                    }
                />
                <Work
                    imgSrc={Icon3}
                    title={"Start Earning"}
                    description={
                        "Choose between auctions and fixed-price listings. Start earning by selling your NFTs or trading others."
                    }
                />
            </div>
        </div>
    );
}
