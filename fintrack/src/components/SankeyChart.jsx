import { useEffect, useRef, useState } from 'react';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';

const CAT_COLOR = {
  Dining: '#f97316', Shopping: '#a78bfa', Groceries: '#34d399',
  Transport: '#60a5fa', Health: '#f472b6', Subscriptions: '#818cf8',
  Utilities: '#2dd4bf', Housing: '#fbbf24', Insurance: '#60a5fa',
  Travel: '#38bdf8', Entertainment: '#e879f9', Other: '#9ca3af',
  'Payroll / Income': '#34d399', Income: '#34d399',
};

export default function SankeyChart({ nodes, links, width = 1000, height = 420, budget }) {
  const svgRef = useRef(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: '' });
  const [hoveredLinkIndex, setHoveredLinkIndex] = useState(null);

  useEffect(() => {
    if (!svgRef.current || !nodes || nodes.length === 0) return;

    // Calculate layout
    const generator = sankey()
      .nodeWidth(24)
      .nodePadding(80)
      .extent([[0, 0], [width - 40, height - 40]]);

    const graph = generator({ nodes: [...nodes], links: [...links] });

    const svg = svgRef.current;
    // Clear previous content
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    // Background
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('width', width);
    bgRect.setAttribute('height', height);
    bgRect.setAttribute('fill', '#0a0e1a');
    svg.appendChild(bgRect);

    // Create a group for links
    const linksGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(linksGroup);

    // Create links
    const linkGenerator = sankeyLinkHorizontal();
    graph.links.forEach((link, linkIdx) => {
      const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const color = CAT_COLOR[link.target.name] || '#9ca3af';

      pathElement.setAttribute('d', linkGenerator(link));
      pathElement.setAttribute('fill', 'none');
      pathElement.setAttribute('stroke', color);
      pathElement.setAttribute(
        'stroke-opacity',
        hoveredLinkIndex === null ? '0.3' : hoveredLinkIndex === linkIdx ? '0.75' : '0.08'
      );
      pathElement.setAttribute('stroke-width', '12');
      pathElement.style.cursor = 'pointer';
      pathElement.style.transition = 'stroke-opacity 0.2s';

      pathElement.addEventListener('mouseenter', (e) => {
        setHoveredLinkIndex(linkIdx);
        const amount = Math.abs(link.value);
        const totalIncome = links.reduce((s, l) => s + l.value, 0);
        const pctOfIncome = ((link.value / totalIncome) * 100).toFixed(1);
        const content = `${link.target.name} · $${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })} · ${pctOfIncome}% of income`;

        const rect = svgRef.current.getBoundingClientRect();
        setTooltip({
          visible: true,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          content,
        });
      });

      pathElement.addEventListener('mousemove', (e) => {
        const rect = svgRef.current.getBoundingClientRect();
        setTooltip((prev) => ({
          ...prev,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        }));
      });

      pathElement.addEventListener('mouseleave', () => {
        setHoveredLinkIndex(null);
        setTooltip({ visible: false, x: 0, y: 0, content: '' });
      });

      linksGroup.appendChild(pathElement);
    });

    // Create nodes group
    const nodesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(nodesGroup);

    // Create nodes
    graph.nodes.forEach((node) => {
      // Node rect
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      const color = CAT_COLOR[node.name] || '#9ca3af';

      rect.setAttribute('x', node.x0);
      rect.setAttribute('y', node.y0);
      rect.setAttribute('width', node.x1 - node.x0);
      rect.setAttribute('height', node.y1 - node.y0);
      rect.setAttribute('fill', color);
      rect.setAttribute('fill-opacity', '0.2');
      rect.setAttribute('rx', '6');
      rect.style.cursor = 'pointer';

      rect.addEventListener('mouseenter', (e) => {
        const tooltipContent = `${node.name}\n$${node.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        const rect = svgRef.current.getBoundingClientRect();
        setTooltip({
          visible: true,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          content: tooltipContent,
        });
      });

      rect.addEventListener('mousemove', (e) => {
        const rect = svgRef.current.getBoundingClientRect();
        setTooltip((prev) => ({
          ...prev,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        }));
      });

      rect.addEventListener('mouseleave', () => {
        setTooltip({ visible: false, x: 0, y: 0, content: '' });
      });

      nodesGroup.appendChild(rect);

      // Node label (left or right depending on position)
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      const isIncome = node.name === 'Payroll / Income' || node.name === 'Income';
      const isAggregator = node.name === 'Total Income';

      label.setAttribute('x', isIncome || isAggregator ? node.x0 - 8 : node.x1 + 8);
      label.setAttribute('y', (node.y0 + node.y1) / 2);
      label.setAttribute('text-anchor', isIncome || isAggregator ? 'end' : 'start');
      label.setAttribute('dominant-baseline', 'middle');
      label.setAttribute('fill', '#f9fafb');
      label.setAttribute('font-size', '12');
      label.setAttribute('font-weight', '500');
      label.textContent = node.name;

      nodesGroup.appendChild(label);

      // Amount label
      const amountLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      const totalIncome = nodes[1]?.value || 1;
      const pct = ((node.value / totalIncome) * 100).toFixed(0);

      amountLabel.setAttribute('x', node.x1 + 8);
      amountLabel.setAttribute('y', (node.y0 + node.y1) / 2);
      amountLabel.setAttribute('text-anchor', 'start');
      amountLabel.setAttribute('dominant-baseline', 'middle');
      amountLabel.setAttribute('fill', color);
      amountLabel.setAttribute('font-size', '11');
      amountLabel.textContent = `$${node.value.toLocaleString('en-US', { maximumFractionDigits: 0 })} (${pct}%)`;

      nodesGroup.appendChild(amountLabel);

      // Over-budget warning
      if (budget && budget[node.name] && node.value > budget[node.name]) {
        const warning = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        warning.setAttribute('x', node.x1 + 100);
        warning.setAttribute('y', (node.y0 + node.y1) / 2 - 6);
        warning.setAttribute('text-anchor', 'start');
        warning.setAttribute('dominant-baseline', 'middle');
        warning.setAttribute('fill', '#f59e0b');
        warning.setAttribute('font-size', '12');
        warning.textContent = '⚠';
        nodesGroup.appendChild(warning);
      }
    });
  }, [nodes, links, hoveredLinkIndex, width, height, budget]);

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ display: 'block', margin: '0 auto' }}
      />
      {tooltip.visible && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.x,
            top: tooltip.y,
            background: '#1f2937',
            border: '0.5px solid #374151',
            borderRadius: '8px',
            padding: '10px 14px',
            color: '#f9fafb',
            fontSize: '12px',
            pointerEvents: 'none',
            zIndex: 50,
            whiteSpace: 'pre-wrap',
            maxWidth: 250,
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
}
