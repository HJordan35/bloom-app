import { Chips } from "../../components/Chips";
import { HeaderAction } from "../../components/HeaderAction";
import { Section } from "../../components/Section";
import { Sheet } from "../../components/Sheet";

type Props = {
  methods: readonly string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  onClose: () => void;
};

/** Tick any number of methods; the list filters as you go. None ticked means all. */
export function MethodFilterSheet({ methods, selected, onChange, onClose }: Props) {
  function toggle(method: string) {
    onChange(
      selected.includes(method) ? selected.filter((m) => m !== method) : [...selected, method],
    );
  }

  return (
    <Sheet title="Methods" onClose={onClose}>
      <Section
        label="Method"
        action={
          selected.length > 0 && <HeaderAction onClick={() => onChange([])}>Clear</HeaderAction>
        }
      >
        <Chips options={methods} value={selected} onChange={toggle} />
      </Section>
    </Sheet>
  );
}
