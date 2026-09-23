/**
 * Minimal dependency-free bar chart, rendered as inline SVG. Deliberately
 * simple — this is a "couple of data points," not a charting library.
 * @param {{labels:string[], values:number[], unit?:string}} data
 * @returns {SVGElement}
 */
export function renderBarChart(data) {
  const { labels, values, unit = '' } = data;
  const w = 560;
  const h = 200;
  const padTop = 16;
  const padBottom = 28;
  const barGap = 18;
  const barWidth = (w - barGap * (values.length + 1)) / values.length;
  const max = Math.max(...values) * 1.15;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.setAttribute('class', 'doc-chart__svg');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `Bar chart: ${labels.join(', ')}`);

  const ns = 'http://www.w3.org/2000/svg';
  const chartH = h - padTop - padBottom;

  values.forEach((value, i) => {
    const barH = (value / max) * chartH;
    const x = barGap + i * (barWidth + barGap);
    const y = padTop + (chartH - barH);

    const rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', barWidth);
    rect.setAttribute('height', barH);
    rect.setAttribute('rx', 4);
    rect.setAttribute('class', 'doc-chart__bar');
    rect.style.setProperty('--bar-delay', `${i * 60}ms`);
    svg.appendChild(rect);

    const valueLabel = document.createElementNS(ns, 'text');
    valueLabel.setAttribute('x', x + barWidth / 2);
    valueLabel.setAttribute('y', y - 6);
    valueLabel.setAttribute('text-anchor', 'middle');
    valueLabel.setAttribute('class', 'doc-chart__value');
    valueLabel.textContent = `${value}${unit}`;
    svg.appendChild(valueLabel);

    const label = document.createElementNS(ns, 'text');
    label.setAttribute('x', x + barWidth / 2);
    label.setAttribute('y', h - 10);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('class', 'doc-chart__label');
    label.textContent = labels[i];
    svg.appendChild(label);
  });

  const baseline = document.createElementNS(ns, 'line');
  baseline.setAttribute('x1', 0);
  baseline.setAttribute('x2', w);
  baseline.setAttribute('y1', padTop + chartH);
  baseline.setAttribute('y2', padTop + chartH);
  baseline.setAttribute('class', 'doc-chart__baseline');
  svg.appendChild(baseline);

  return svg;
}
