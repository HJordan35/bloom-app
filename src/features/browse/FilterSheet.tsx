import { Chips } from "../../components/Chips";
import { HeaderAction } from "../../components/HeaderAction";
import { Section } from "../../components/Section";
import { Sheet } from "../../components/Sheet";

type Props = {
  title: string;
  /** The section label over the boxes, e.g. "Method". */
  label: string;
  options: readonly string[];
  /** What each option reads as, when it isn't its own label. */
  format?: (option: string) => string;
  selected: string[];
  onChange: (selected: string[]) => void;
  onClose: () => void;
};

/**
 * A list filter's drawer: tick any number of boxes, and the list filters as you go. None
 * ticked means all. Methods and bros both use it.
 */
export function FilterSheet({ title, label, options, format, selected, onChange, onClose }: Props) {
  function toggle(option: string) {
    onChange(
      selected.includes(option) ? selected.filter((o) => o !== option) : [...selected, option],
    );
  }

  return (
    <Sheet title={title} onClose={onClose}>
      <Section
        label={label}
        action={
          selected.length > 0 && <HeaderAction onClick={() => onChange([])}>Clear</HeaderAction>
        }
      >
        <Chips options={options} value={selected} onChange={toggle} format={format} />
      </Section>
    </Sheet>
  );
}
