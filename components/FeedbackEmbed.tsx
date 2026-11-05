const FEEDBACK_EMBED_URL = "https://novacrate.datamanager.kit.edu/feedback/embed"
const FEEDBACK_KEY = "fb_e72ff7097a519b73b129a2e5f721f508"

export function FeedbackEmbed() {
    const params = new URLSearchParams({
        k: FEEDBACK_KEY,
        type: "rating"
    })

    return (
        <iframe
            src={`${FEEDBACK_EMBED_URL}?${params.toString()}`}
            title="Feedback"
            style={{ width: "100%", maxWidth: 480, height: 460, border: 0 }}
        />
    )
}
