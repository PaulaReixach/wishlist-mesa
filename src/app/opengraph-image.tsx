import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt =
  "MESA — Los mejores planes empiezan alrededor de una mesa";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "nodejs";

export default async function OpenGraphImage() {
  const logoData = await readFile(join(process.cwd(), "public", "mesa-logo.png"));
  const logoSource = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          alignItems: "center",
          padding: "76px 86px",
          color: "#2f171b",
          background: "#fffdf8",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 540,
            height: 540,
            right: -120,
            bottom: -190,
            borderRadius: "50%",
            background: "#f1ded5",
          }}
        />
        <img
          src={logoSource}
          alt=""
          width="260"
          height="260"
          style={{
            position: "absolute",
            width: 260,
            height: 260,
            right: 110,
            top: 90,
            borderRadius: "50%",
            boxShadow: "0 30px 70px rgba(72,38,43,.2)",
            objectFit: "contain",
            transform: "rotate(6deg)",
          }}
        />
        <div
          style={{
            width: 720,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              marginBottom: 34,
              color: "#c9634b",
              fontFamily: "Arial, sans-serif",
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: 6,
            }}
          >
            MESA
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 74,
              lineHeight: 1.03,
              letterSpacing: -3,
            }}
          >
            Los mejores planes empiezan alrededor de una mesa.
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 30,
              color: "#736a66",
              fontFamily: "Arial, sans-serif",
              fontSize: 24,
            }}
          >
            Descubrir · Guardar · Compartir · Decidir
          </div>
        </div>
      </div>
    ),
    size,
  );
}
