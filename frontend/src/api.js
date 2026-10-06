const API_BASE_URL = 'http://localhost:8000'

/**
 * Uploads a real user CSV file to the backend.
 *
 * IMPORTANT:
 * This is the real FinOptix analysis pipeline.
 * User-uploaded CSV files still go through the backend,
 * feature engineering, forecasting, health classification,
 * optimization and remediation logic.
 */
export async function analyzeFile(file) {
    const formData = new FormData()

    formData.append('file', file)

    const response = await fetch(
        `${API_BASE_URL}/analyze`,
        {
            method: 'POST',
            body: formData,
        }
    )

    if (!response.ok) {
        const errorBody = await response
            .json()
            .catch(() => ({}))

        throw new Error(
            errorBody.detail ||
            `Request failed with status ${response.status}`
        )
    }

    return response.json()
}