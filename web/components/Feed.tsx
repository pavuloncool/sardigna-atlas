import { Fragment, type ReactNode } from "react";
import { AD_EVERY } from "@/lib/config";
import { AdSlot } from "./AdSlot";

/** Siatka kart (dwie kolumny z prototypu) ze slotem In-Feed co `AD_EVERY` pozycji. */
export function Feed({
  items,
  className = "feed",
}: {
  items: { key: string; node: ReactNode }[];
  className?: string;
}) {
  return (
    <div className={className} data-pagefind-ignore>
      {items.map((item, i) => (
        <Fragment key={item.key}>
          {item.node}
          {(i + 1) % AD_EVERY === 0 && i + 1 < items.length ? <AdSlot variant="in-feed" /> : null}
        </Fragment>
      ))}
    </div>
  );
}
