#!/usr/bin/env python3
"""Benchmark the internal link analyzer against realistic scenarios."""

from audit_platform.analyzers.internal_linking import InternalLinkAnalyzer

def test_realistic_site_structure():
    """Test 1: Realistic site with hub/spoke pattern (10-15 pages)."""
    print("\n=== TEST 1: Realistic Site Structure ===")

    analyzer = InternalLinkAnalyzer()
    homepage = "https://example.com"

    # Structure:
    # Homepage links to 5 section pages
    # Each section links to 2-3 child pages
    # Some cross-linking between sections
    edges = {
        "https://example.com": [
            "https://example.com/blog",
            "https://example.com/products",
            "https://example.com/about",
            "https://example.com/services",
            "https://example.com/contact",
        ],
        "https://example.com/blog": [
            "https://example.com/blog/post-1",
            "https://example.com/blog/post-2",
            "https://example.com/products",  # cross-link
        ],
        "https://example.com/blog/post-1": [
            "https://example.com/blog/post-2",
        ],
        "https://example.com/blog/post-2": [
            "https://example.com/blog/post-1",
        ],
        "https://example.com/products": [
            "https://example.com/products/widget",
            "https://example.com/products/gadget",
            "https://example.com/products/tool",
        ],
        "https://example.com/products/widget": [
            "https://example.com/products/gadget",
        ],
        "https://example.com/products/gadget": [
            "https://example.com/products/tool",
        ],
        "https://example.com/products/tool": [],
        "https://example.com/about": [
            "https://example.com/about/team",
            "https://example.com/about/history",
        ],
        "https://example.com/about/team": [
            "https://example.com/about/history",
        ],
        "https://example.com/about/history": [],
        "https://example.com/services": [
            "https://example.com/services/consulting",
        ],
        "https://example.com/services/consulting": [],
        "https://example.com/contact": [],
    }

    sitemap_urls = list(edges.keys()) + [u for urls in edges.values() for u in urls]
    sitemap_urls = list(set(sitemap_urls))

    result = analyzer.analyze(edges, sitemap_urls, homepage)

    print(f"Total pages: {result.total_pages} (expected ~14)")
    print(f"Total edges: {result.total_internal_links}")
    print(f"Orphan count: {result.orphan_count} (expected 0)")
    print(f"Homepage PageRank: {result.nodes[0].pagerank:.4f} (should be highest)")

    # Homepage should be in nodes
    homepage_node = next((n for n in result.nodes if n.url == homepage), None)
    if homepage_node:
        print(f"Homepage depth: {homepage_node.link_depth} (expected 0)")
        print(f"Homepage inbound: {homepage_node.inbound_count} (expected 0)")
        print(f"Homepage outbound: {homepage_node.outbound_count} (expected 5)")

    # Check depths
    depths_by_page = {n.url: n.link_depth for n in result.nodes}
    section_depths = [depths_by_page.get(f"https://example.com/{s}", -1) for s in ["blog", "products", "about", "services", "contact"]]
    print(f"Section page depths: {section_depths} (expected all 1)")

    # Check avg metrics
    print(f"Avg inbound: {result.avg_inbound_links:.2f} (should be reasonable)")
    print(f"Avg outbound: {result.avg_outbound_links:.2f} (should be reasonable)")
    print(f"Status: {'PASS' if result.orphan_count == 0 and result.total_pages > 10 else 'FAIL'}")
    return result.orphan_count == 0 and result.total_pages > 10

def test_orphan_detection():
    """Test 2: Detect pages with no inbound links."""
    print("\n=== TEST 2: Orphan Detection ===")

    analyzer = InternalLinkAnalyzer()
    homepage = "https://example.com"

    edges = {
        "https://example.com": [
            "https://example.com/linked-page",
        ],
        "https://example.com/linked-page": [],
        # orphan-1 and orphan-2 have no edges pointing to them
    }

    sitemap_urls = [
        "https://example.com",
        "https://example.com/linked-page",
        "https://example.com/orphan-1",
        "https://example.com/orphan-2",
    ]

    result = analyzer.analyze(edges, sitemap_urls, homepage)

    print(f"Total pages: {result.total_pages} (expected 4)")
    print(f"Orphan count: {result.orphan_count} (expected 2)")
    print(f"Orphan URLs: {[o.url for o in result.orphans]}")

    orphan_urls = {o.url for o in result.orphans}
    expected_orphans = {"https://example.com/orphan-1", "https://example.com/orphan-2"}
    print(f"Status: {'PASS' if orphan_urls == expected_orphans else 'FAIL'}")
    return orphan_urls == expected_orphans

def test_hub_page_identification():
    """Test 3: Identify hub pages with many outbound links."""
    print("\n=== TEST 3: Hub Page Identification ===")

    analyzer = InternalLinkAnalyzer()
    homepage = "https://example.com"

    # Hub page links to 15+ spokes
    spokes = [f"https://example.com/spoke-{i}" for i in range(16)]
    edges = {
        "https://example.com": ["https://example.com/hub"] + spokes,
        "https://example.com/hub": spokes,  # Hub links to all spokes
    }
    # Spokes link back to hub (bidirectional) and to each other
    for spoke in spokes:
        edges[spoke] = ["https://example.com/hub"]  # back to hub

    sitemap_urls = list(edges.keys()) + spokes
    result = analyzer.analyze(edges, sitemap_urls, homepage)

    hub_clusters = result.hub_clusters
    print(f"Hub clusters found: {len(hub_clusters)}")

    if hub_clusters:
        hub = hub_clusters[0]
        print(f"Hub URL: {hub.hub_url}")
        print(f"Hub outbound: {hub.hub_outbound} (expected ~16)")
        print(f"Spokes identified: {hub.spoke_count} (expected > 10)")
        print(f"Status: {'PASS' if hub.hub_url == 'https://example.com/hub' and hub.spoke_count > 10 else 'FAIL'}")
        return hub.hub_url == "https://example.com/hub" and hub.spoke_count > 10
    else:
        print("Status: FAIL (no hubs detected)")
        return False

def test_disconnected_component():
    """Test 4: Handle disconnected page clusters."""
    print("\n=== TEST 4: Disconnected Component ===")

    analyzer = InternalLinkAnalyzer()
    homepage = "https://example.com"

    # Main site
    edges = {
        "https://example.com": ["https://example.com/page-1"],
        "https://example.com/page-1": [],
        # Isolated cluster
        "https://example.com/isolated-1": ["https://example.com/isolated-2"],
        "https://example.com/isolated-2": ["https://example.com/isolated-3"],
        "https://example.com/isolated-3": ["https://example.com/isolated-1"],
    }

    sitemap_urls = list(edges.keys())
    result = analyzer.analyze(edges, sitemap_urls, homepage)

    print(f"Total pages: {result.total_pages} (expected 5)")
    print(f"Unreachable from homepage: {result.unreachable_count} (expected 3)")

    # Check that isolated pages have link_depth -1 or unreachable list
    isolated_depths = {}
    for node in result.nodes:
        if "isolated" in node.url:
            isolated_depths[node.url] = node.link_depth
            print(f"{node.url}: depth={node.link_depth}")

    all_unreachable = all(d == -1 for d in isolated_depths.values())
    print(f"Status: {'PASS' if result.unreachable_count == 3 and all_unreachable else 'FAIL'}")
    return result.unreachable_count == 3 and all_unreachable

def test_thin_internal_linking():
    """Test 5: Flag weak internal linking."""
    print("\n=== TEST 5: Thin Internal Linking ===")

    analyzer = InternalLinkAnalyzer()
    homepage = "https://example.com"

    # Sparse linking: each page links to only 1-2 others
    edges = {
        "https://example.com": ["https://example.com/page-1"],
        "https://example.com/page-1": ["https://example.com/page-2"],
        "https://example.com/page-2": ["https://example.com/page-3"],
        "https://example.com/page-3": ["https://example.com/page-4"],
        "https://example.com/page-4": [],
    }

    sitemap_urls = list(edges.keys())
    result = analyzer.analyze(edges, sitemap_urls, homepage)

    print(f"Total pages: {result.total_pages}")
    print(f"Avg inbound links: {result.avg_inbound_links:.2f} (expected < 2.0)")
    print(f"Issues flagged: {result.issues}")
    print(f"Recommendations: {result.recommendations}")

    has_weak_linking = "WEAK_INTERNAL_LINKING" in result.issues
    print(f"Status: {'PASS' if has_weak_linking else 'FAIL'}")
    return has_weak_linking

def test_summary_stats_accuracy():
    """Test 6: Verify all summary stats compute correctly."""
    print("\n=== TEST 6: Summary Stats Accuracy ===")

    analyzer = InternalLinkAnalyzer()
    homepage = "https://example.com"

    edges = {
        "https://example.com": ["https://example.com/a", "https://example.com/b"],
        "https://example.com/a": ["https://example.com/b", "https://example.com/c"],
        "https://example.com/b": ["https://example.com/c"],
        "https://example.com/c": [],
    }

    sitemap_urls = list(edges.keys())
    result = analyzer.analyze(edges, sitemap_urls, homepage)

    # Manual calculations
    expected_pages = 4
    expected_edges = 5  # a->b, a->c, b->c + homepage's 2 links
    expected_orphans = 0

    print(f"Total pages: {result.total_pages} (expected {expected_pages})")
    print(f"Total edges: {result.total_internal_links} (expected {expected_edges})")
    print(f"Orphan count: {result.orphan_count} (expected {expected_orphans})")
    print(f"Orphan rate: {result.orphan_rate:.2%}")
    print(f"Avg inbound: {result.avg_inbound_links:.2f}")
    print(f"Avg outbound: {result.avg_outbound_links:.2f}")
    print(f"Max depth: {result.depth_result.max_depth} (expected 2)")
    print(f"Avg depth: {result.depth_result.avg_depth:.2f}")

    correct_pages = result.total_pages == expected_pages
    correct_edges = result.total_internal_links == expected_edges
    correct_orphans = result.orphan_count == expected_orphans
    correct_max_depth = result.depth_result.max_depth == 2

    all_correct = correct_pages and correct_edges and correct_orphans and correct_max_depth
    print(f"Status: {'PASS' if all_correct else 'FAIL'}")
    return all_correct

def test_circular_links():
    """Test 7: Circular links shouldn't crash or infinite loop."""
    print("\n=== TEST 7: Circular Links (No Crash) ===")

    analyzer = InternalLinkAnalyzer()
    homepage = "https://example.com"

    # Circular: a -> b -> c -> a
    edges = {
        "https://example.com": ["https://example.com/a"],
        "https://example.com/a": ["https://example.com/b"],
        "https://example.com/b": ["https://example.com/c"],
        "https://example.com/c": ["https://example.com/a"],
    }

    sitemap_urls = list(edges.keys())

    try:
        result = analyzer.analyze(edges, sitemap_urls, homepage)
        print(f"Total pages: {result.total_pages}")
        print(f"PageRank computed without crash: {len(result.nodes)} nodes")
        print(f"Status: PASS")
        return True
    except Exception as e:
        print(f"ERROR: {e}")
        print(f"Status: FAIL")
        return False

def main():
    """Run all benchmark tests."""
    print("=" * 60)
    print("INTERNAL LINK ANALYZER BENCHMARK")
    print("=" * 60)

    results = []
    results.append(("Realistic Site Structure", test_realistic_site_structure()))
    results.append(("Orphan Detection", test_orphan_detection()))
    results.append(("Hub Page Identification", test_hub_page_identification()))
    results.append(("Disconnected Component", test_disconnected_component()))
    results.append(("Thin Internal Linking", test_thin_internal_linking()))
    results.append(("Summary Stats Accuracy", test_summary_stats_accuracy()))
    results.append(("Circular Links (No Crash)", test_circular_links()))

    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status:8} {name}")

    print(f"\nTotal: {passed}/{total} tests passed")

    if passed == total:
        print("\n🎯 PRODUCTION READY: All validation scenarios passed.")
    else:
        print(f"\n⚠️  NEEDS WORK: {total - passed} scenarios failed.")

    return passed == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
