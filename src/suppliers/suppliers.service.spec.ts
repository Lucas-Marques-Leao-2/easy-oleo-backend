import { ConflictException, NotFoundException } from "@nestjs/common";

import { SuppliersRepository } from "./suppliers.repository";
import { SuppliersService } from "./suppliers.service";

const now = new Date("2026-04-20T10:00:00.000Z");

function supplier(overrides: Record<string, unknown> = {}) {
  return {
    id: "supplier-1",
    legalName: "Distribuidora Lubrificantes Nordeste S.A.",
    cnpj: "11222333000181",
    street: "Rodovia BR-104",
    number: "Km 12",
    complement: "Anexo expedição",
    district: "Tabuleiro do Martins",
    city: "Maceió",
    state: "AL",
    zipCode: "57081065",
    email: "vendas@lubnordeste.com.br",
    phones: [
      { id: "phone-1", number: "82988887777", supplierId: "supplier-1" },
    ],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("SuppliersService", () => {
  let repo: jest.Mocked<SuppliersRepository>;
  let service: SuppliersService;

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByCnpj: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<SuppliersRepository>;
    service = new SuppliersService(repo);
  });

  it("creates a supplier when CNPJ is unique", async () => {
    const dto = {
      legalName: "Distribuidora Lubrificantes Nordeste S.A.",
      cnpj: "11222333000181",
      street: "Rodovia BR-104",
      number: "Km 12",
      city: "Maceió",
      state: "AL",
      zipCode: "57081065",
      email: "vendas@lubnordeste.com.br",
      phones: ["82988887777"],
    };
    repo.findByCnpj.mockResolvedValue(null);
    repo.create.mockResolvedValue(supplier() as never);

    await expect(service.create(dto)).resolves.toMatchObject({
      id: "supplier-1",
      phones: [{ id: "phone-1", number: "82988887777" }],
    });
    expect(repo.create).toHaveBeenCalledWith(dto);
  });

  it("rejects duplicate CNPJ", async () => {
    repo.findByCnpj.mockResolvedValue(supplier() as never);

    await expect(
      service.create({ cnpj: "11222333000181" } as never),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(repo.create).not.toHaveBeenCalled();
  });

  it("covers read/update/remove and missing supplier paths", async () => {
    repo.findAll.mockResolvedValue([supplier()] as never);
    repo.findById.mockResolvedValueOnce(supplier() as never);
    repo.findById.mockResolvedValueOnce(supplier() as never);
    repo.findById.mockResolvedValueOnce(supplier() as never);
    repo.update.mockResolvedValue(supplier({ legalName: "Updated" }) as never);
    repo.remove.mockResolvedValue(supplier() as never);

    await expect(service.findAll()).resolves.toHaveLength(1);
    await expect(service.findOne("supplier-1")).resolves.toMatchObject({
      id: "supplier-1",
    });
    await expect(
      service.update("supplier-1", { legalName: "Updated" }),
    ).resolves.toMatchObject({
      legalName: "Updated",
    });
    await expect(service.remove("supplier-1")).resolves.toMatchObject({
      id: "supplier-1",
    });

    repo.findById.mockResolvedValue(null);
    await expect(service.findOne("missing")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
