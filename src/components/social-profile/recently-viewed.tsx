import { Search } from "lucide-react";

export function RecentlyViewed() {
  return (
    <div className="min-h-[500px] rounded-lg border border-border-subtle bg-[#292929]/30 p-12 backdrop-blur-md">
      <h2 className="mb-6 font-medium text-2xl text-text-primary">Recently viewed by you</h2>

      <div className="relative mb-12">
        <Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-text-secondary" />
        <input
          type="text"
          placeholder="Search recently viewed"
          className="w-full rounded-md border border-border-subtle bg-bg-text-field py-2 pr-3 pl-10 text-sm text-text-primary placeholder:text-text-secondary focus:border-border-active focus:outline-none"
        />
      </div>

      <div className="flex flex-col items-center justify-center space-y-4 pt-4 pb-16 text-center">
        <p className="text-text-primary">You don't have any recently viewed profiles.</p>
        <p className="text-text-primary">
          Connect with another hacker and scan their QR
          <br />
          code to see their profile here! 🤝
        </p>
      </div>
    </div>
  );
}
