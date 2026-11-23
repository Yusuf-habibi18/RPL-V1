import { NextResponse } from "next/server";

/** Respons sementara untuk endpoint yang dijadwalkan di sprint berikutnya. */
export function belumTersedia(kebutuhan: string[], sprint: number) {
  return NextResponse.json(
    { error: "Endpoint belum diimplementasikan", kebutuhan, sprint },
    { status: 501 },
  );
}
