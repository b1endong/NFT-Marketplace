import {Link} from "react-router-dom";
import {EmptyState} from "../components/common/States";

export default function NotFound() {
    return (
        <div className="max-w-calc m-auto py-20">
            <EmptyState icon="fa-solid fa-compass" title="404 — Page not found">
                <Link to="/" className="base-button px-8 inline-block mt-4">
                    Back to Home
                </Link>
            </EmptyState>
        </div>
    );
}
