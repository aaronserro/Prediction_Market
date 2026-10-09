import { Link } from "react-router-dom";
import { Page, card } from "../components/ui.jsx";

export default function TournamentsPage() {
  return (
    <Page>
      <div className={`${card} max-w-2xl mx-auto mt-10 px-6 py-14 text-center`}>
        <span className="inline-block px-2.5 py-[3px] rounded-md bg-ams text-amt text-xs font-semibold mb-5">In development</span>
        <h1 className="m-0 mb-3 text-[32px] font-[650] tracking-[-0.035em]">Tournaments are on the way</h1>
        <p className="m-0 mx-auto mb-7 max-w-md text-[15px] leading-[1.6] text-tx2">
          We're building head-to-head prediction tournaments with leaderboards and prizes. Check back soon.
        </p>
        <Link to="/markets" className="inline-flex items-center h-[42px] px-[18px] rounded-[10px] bg-pr hover:bg-prh text-white text-[14px] font-semibold">
          Browse markets →
        </Link>
      </div>
    </Page>
  );
}
