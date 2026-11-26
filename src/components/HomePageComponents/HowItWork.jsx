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
            <div className="mt-15 grid md:grid-cols-3 gap-8">
                <Work
                    step={1}
                    delay={0}
                    imgSrc={Icon}
                    title={"Setup Your Wallet"}
                    description={
                        "Set up your wallet of choice. Connect MetaMask to the KSEA Marketplace using the Connect Wallet button in the top right corner."
                    }
                />
                <Work
                    step={2}
                    delay={120}
                    imgSrc={Icon2}
                    title={"Create Your NFT"}
                    description={
                        "Upload your artwork, add a name, description, category and properties, then mint it on-chain."
                    }
                />
                <Work
                    step={3}
                    delay={240}
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
