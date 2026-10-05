import * as stylex from "@stylexjs/stylex";
import { Button } from "../../components/Button";
import { Section } from "../../components/Section";
import { useData } from "../../lib/useData";
import { useLive } from "../../lib/useLive";
import { colors, fonts, radius, space } from "../../theme/tokens.stylex";
import { fetchRoasts } from "./api";
import { developRoastPhoto, photoUrl } from "./photos";
import { RoastPhoto } from "./RoastPhoto";

/** Hidden calibration page (/library/studio): originals vs studio photos, with re-shoot. */
export function StudioCheckPage() {
  const { data, reload } = useData(fetchRoasts, []);
  useLive(["roasts"], reload);
  if (!data) return null;
  const roasts = data
    .filter((r) => r.photo_original_path)
    .sort((a, b) => a.roaster.name.localeCompare(b.roaster.name));

  return (
    <div {...stylex.props(styles.page)}>
      <Section label="Studio photos together">
        <div {...stylex.props(styles.grid)}>
          {roasts.map((roast) => (
            <RoastPhoto key={roast.id} roast={roast} />
          ))}
        </div>
      </Section>

      <Section label="Original → studio">
        {roasts.map((roast) => (
          <div key={roast.id} {...stylex.props(styles.row)}>
            <p {...stylex.props(styles.name)}>
              {roast.roaster.name} · {roast.name}
              <span {...stylex.props(styles.status)}> {roast.photo_status ?? "no studio"}</span>
            </p>
            <div {...stylex.props(styles.pair)}>
              <img
                src={photoUrl(roast.photo_original_path) ?? ""}
                alt=""
                {...stylex.props(styles.image)}
              />
              <RoastPhoto roast={roast} />
            </div>
            <Button
              variant="ghost"
              disabled={roast.photo_status === "processing"}
              onClick={() => developRoastPhoto(roast.id)}
            >
              Re-shoot
            </Button>
          </div>
        ))}
      </Section>
    </div>
  );
}

const styles = stylex.create({
  page: {
    display: "flex",
    flexDirection: "column",
    gap: space.lg,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: space.xs,
  },
  row: {
    display: "flex",
    flexDirection: "column",
    gap: space.sm,
    paddingBlock: space.md,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: colors.hairline,
  },
  name: {
    fontSize: 13,
  },
  status: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.muted,
  },
  pair: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: space.sm,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    aspectRatio: "4 / 5",
    objectFit: "contain",
    backgroundColor: colors.surfaceRaised,
  },
});
