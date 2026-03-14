import { memo } from "react";
import { tokenLabel, BOS } from "../engine/model";

interface TokenBoxProps {
  tokenId: number;
  index: number;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

function TokenBoxInner({
  tokenId,
  index,
  className,
  style,
  onClick,
}: TokenBoxProps) {
  const label = tokenLabel(tokenId);
  const isBos = tokenId === BOS;
  return (
    <span className="d-contents">
      {index > 0 && (
        <span
          className="arrow-sym"
          style={{ animationDelay: `${index * 80 + 60}ms` }}
        >
          &rarr;
        </span>
      )}
      <div
        className={`token-box ${isBos ? "bos" : ""} ${className ?? ""}`}
        style={{ animationDelay: `${index * 80}ms`, ...style }}
        onClick={onClick}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={
          onClick
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
      >
        <span className="char">{label}</span>
        <span className="id">id: {tokenId}</span>
      </div>
    </span>
  );
}

const TokenBox = memo(TokenBoxInner);
export default TokenBox;
