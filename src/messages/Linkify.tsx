import {Link} from "@mui/material";

// http(s):// or www. up to the next space, without the punctuation that ends a sentence ("see https://x.com.")
const URL_REGEX = /((?:https?:\/\/|www\.)[^\s<]*[^\s<.,;:!?'")\]}])/gi;

/** Text where the links are clickable. Only http(s) links are made, React escapes everything else. */
export function Linkify({text}: { text: string }) {
    // split() with a capturing group keeps the links : odd positions are links, even positions are plain text
    return (
        <>
            {text.split(URL_REGEX).map((part, index) => index % 2 === 0
                ? part
                : (
                    <Link key={index} href={part.toLowerCase().startsWith("www.") ? "https://" + part : part}
                          target="_blank" rel="noopener noreferrer" color="inherit" underline="always"
                          onClick={event => event.stopPropagation()}>
                        {part}
                    </Link>
                ))}
        </>
    );
}
