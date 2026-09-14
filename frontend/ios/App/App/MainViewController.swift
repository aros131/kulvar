import UIKit
import Capacitor

// Turns on WKWebView's native edge-swipe back/forward gesture — the same
// "swipe from the left edge to go back" behavior Safari gives any site that
// uses pushState-based routing (which is exactly what Next.js's router does).
// Capacitor's stock CAPBridgeViewController doesn't enable this by default,
// so without this override the gesture silently does nothing.
class MainViewController: CAPBridgeViewController {
    override func viewDidLoad() {
        super.viewDidLoad()
        webView?.allowsBackForwardNavigationGestures = true
    }
}
