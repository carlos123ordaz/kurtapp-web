import React from 'react'
import type { HeaderState, StaffMember } from '../types'
import { DEPARTMENTS } from '../data/cotizacionesData'
import {
  I, CotField, CotInput, CotSelect, CotSeg, CotBadge, CotBtn,
  PersonPicker, CotAvatar, fmtMoney,
} from './CotShared'

interface Props {
  data: HeaderState
  setData: (d: HeaderState) => void
  staff: StaffMember[]
}

export function ScreenCabecera({ data, setData, staff }: Props) {
  const up = (k: keyof HeaderState, v: any) => setData({ ...data, [k]: v })
  const upResp = (k: string, v: string) => setData({ ...data, responsables: { ...data.responsables, [k]: v } })

  const staffName = (id: string) => staff.find(s => s._id === id)?.name ?? ''

  return (
    <div className="cot-screen">
      <div className="cot-screen-cols">
        <div className="cot-screen-main">

          {/* Identificación */}
          <section className="cot-card">
            <header className="cot-card-hd">
              <div>
                <h3 className="cot-card-title">Identificación de la oferta</h3>
                <p className="cot-card-sub">Metadatos generales y sincronización con Bitrix24.</p>
              </div>
              {data.rfq && (
                <div className="cot-bitrix-state">
                  <span className="cot-bitrix-dot"/>
                  <div>
                    <div className="cot-bitrix-l1">Deal Bitrix24</div>
                    <div className="cot-bitrix-l2">{data.rfq}</div>
                  </div>
                  <CotBtn kind="ghost" size="sm" icon={I.sync}>Resincronizar</CotBtn>
                </div>
              )}
            </header>
            <div className="cot-card-body">
              <div className="cot-grid-12">
                <CotField label="Número de oferta" required span={3}>
                  <CotInput value={data.offerNo} onChange={(v) => up('offerNo', v)} mono
                             suffix={<button className="cot-inp-sfx-btn" title="Copiar"><I.copy size={12}/></button>}/>
                </CotField>
                <CotField label="Revisión" span={2}>
                  <CotSelect value={data.rev} onChange={(v) => up('rev', v)}
                              options={['Rev.0','Rev.1','Rev.2','Rev.3','Rev.4','Rev.5']}/>
                </CotField>
                <CotField label="Fecha de emisión" required span={3}>
                  <CotInput value={data.fecha} onChange={(v) => up('fecha', v)}
                             suffix={<I.cal size={13} style={{ opacity: .5 }}/>}/>
                </CotField>
                <CotField label="Validez (días)" span={2}>
                  <CotInput value={data.validez} onChange={(v) => up('validez', parseInt(v) || 30)} suffix="días"/>
                </CotField>
                <CotField label="Idioma" span={2}>
                  <CotSelect value={data.idioma} onChange={(v) => up('idioma', v)}
                              options={['Español','Inglés','Bilingüe']}/>
                </CotField>

                <CotField label="TC USD → PEN" span={3}>
                  <CotInput value={data.tcUsd} onChange={(v) => up('tcUsd', v)} prefix="S/" mono
                             suffix={<span style={{ fontSize: 11, color: '#6b7280' }}>SBS</span>}/>
                </CotField>
                <CotField label="TC EUR → USD" span={3}>
                  <CotInput value={data.tcEur} onChange={(v) => up('tcEur', v)} prefix="$" mono/>
                </CotField>
                <CotField label="Moneda de la oferta" required span={3}>
                  <CotSeg value={data.moneda} onChange={(v) => up('moneda', v)}
                           options={[{ value: 'US$', label: 'USD $' }, { value: 'EUR', label: 'EUR €' }, { value: 'S/.', label: 'PEN S/' }]}/>
                </CotField>
                <CotField label="Tipo de oferta" required span={3}>
                  <CotSelect value={data.tipoOferta} onChange={(v) => up('tipoOferta', v)}
                              options={['Técnico-Comercial','Local USD ($)','Local Soles (S/.)','FCA — Origen']}/>
                </CotField>
              </div>
            </div>
          </section>

          {/* Cliente */}
          <section className="cot-card">
            <header className="cot-card-hd">
              <div>
                <h3 className="cot-card-title">Cliente y proyecto</h3>
                <p className="cot-card-sub">Información comercial del destinatario.</p>
              </div>
            </header>
            <div className="cot-card-body">
              <div className="cot-grid-12">
                <CotField label="Razón social" required span={6}>
                  <CotInput value={data.cliente} onChange={(v) => up('cliente', v)}/>
                </CotField>
                <CotField label="RUC" span={3}>
                  <CotInput value={data.ruc} onChange={(v) => up('ruc', v)} mono/>
                </CotField>
                <CotField label="Tipo de cliente" required span={3}>
                  <CotSelect value={data.tipoCliente} onChange={(v) => up('tipoCliente', v)}
                              options={['01 Cliente Final','02 Pyme','03 Partner','04 Canal','05 Competencia']}/>
                </CotField>

                <CotField label="Atención (contacto)" span={4}>
                  <CotInput value={data.contacto} onChange={(v) => up('contacto', v)}/>
                </CotField>
                <CotField label="Cargo del contacto" span={4}>
                  <CotInput value={data.contactoCargo} onChange={(v) => up('contactoCargo', v)}/>
                </CotField>
                <CotField label="Correo del contacto" span={4}>
                  <CotInput value={data.contactoMail} onChange={(v) => up('contactoMail', v)}/>
                </CotField>

                <CotField label="Proyecto / referencia" span={8}>
                  <CotInput value={data.proyecto} onChange={(v) => up('proyecto', v)}/>
                </CotField>
                <CotField label="N° de RFQ del cliente" span={4}>
                  <CotInput value={data.rfq} onChange={(v) => up('rfq', v)} mono/>
                </CotField>
              </div>
            </div>
          </section>

          {/* Categoría y tipo */}
          <section className="cot-card">
            <header className="cot-card-hd">
              <div>
                <h3 className="cot-card-title">Clasificación de la oferta</h3>
                <p className="cot-card-sub">Categoría y condiciones comerciales de entrega.</p>
              </div>
            </header>
            <div className="cot-card-body">
              <div className="cot-grid-12">
                <CotField label="Categoría de oferta" required span={4}>
                  <CotSelect value={data.tipoCategoria} onChange={(v) => up('tipoCategoria', v)}
                              options={['Técnico-Comercial','Técnica','Servicio']}/>
                </CotField>
                <CotField label="Condición de pago" span={4}>
                  <CotInput value={data.condPago} onChange={(v) => up('condPago', v)}
                             placeholder="50% adelanto / 50% entrega"/>
                </CotField>
                <CotField label="Incoterm" span={4}>
                  <CotSelect value={data.condIncoterm} onChange={(v) => up('condIncoterm', v)}
                              options={['','DAP','DDP','FCA','FOB','CIF','EXW']} placeholder="Seleccionar"/>
                </CotField>
                <CotField label="Plazo de entrega" span={6}>
                  <CotInput value={data.condEntrega} onChange={(v) => up('condEntrega', v)}
                             placeholder="8-12 semanas desde confirmación"/>
                </CotField>
                <CotField label="Lugar de entrega" span={6}>
                  <CotInput value={data.condLugar} onChange={(v) => up('condLugar', v)}
                             placeholder="Almacén Corsusa Lima"/>
                </CotField>
              </div>
            </div>
          </section>

          {/* Responsables */}
          <section className="cot-card">
            <header className="cot-card-hd">
              <div>
                <h3 className="cot-card-title">Asignación de responsables</h3>
                <p className="cot-card-sub">Una persona por unidad de negocio. Usado para distribución de márgenes.</p>
              </div>
              <CotBtn kind="ghost" size="sm" icon={I.bolt}>Asignar automático</CotBtn>
            </header>
            <div className="cot-card-body">
              <div className="cot-resp-grid">
                {DEPARTMENTS.map((d) => (
                  <div className="cot-resp-row" key={d.id}>
                    <div className="cot-resp-row-left">
                      <div className="cot-resp-tag">{d.id}</div>
                      <div>
                        <div className="cot-resp-dept-name">{d.name}</div>
                        <div className="cot-resp-dept-desc">{d.desc}</div>
                      </div>
                    </div>
                    <div className="cot-resp-row-right">
                      <PersonPicker
                        value={data.responsables[d.id] ?? ''}
                        onChange={(v) => upResp(d.id, v)}
                        staff={staff}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>

        {/* Aside */}
        <aside className="cot-screen-aside">
          <div className="cot-aside-card">
            <div className="cot-aside-hd">Resumen de la cabecera</div>
            <div className="cot-aside-rows">
              <div className="cot-aside-row"><span>Oferta</span><b className="mono">{data.offerNo} · {data.rev}</b></div>
              <div className="cot-aside-row"><span>Emisión</span><b>{data.fecha}</b></div>
              <div className="cot-aside-row"><span>Validez</span><b>{data.validez} días</b></div>
              <div className="cot-aside-row"><span>Moneda</span><CotBadge kind="teal">{data.moneda}</CotBadge></div>
              <div className="cot-aside-row"><span>Tipo</span><b>{data.tipoOferta}</b></div>
              <div className="cot-aside-row"><span>Cliente</span><b>{data.tipoCliente}</b></div>
            </div>
            <div className="cot-aside-divider"/>
            <div className="cot-aside-hd">Cobertura de unidades</div>
            <div className="cot-aside-rows">
              {DEPARTMENTS.map((d) => {
                const pid = data.responsables[d.id]
                const pName = staffName(pid)
                return (
                  <div className="cot-aside-row" key={d.id}>
                    <span>{d.id}</span>
                    {pName ? (
                      <span className="cot-resp-pill">
                        <CotAvatar name={pName} size={18}/>
                        <span>{pName.split(' ')[0]}</span>
                      </span>
                    ) : (
                      <span className="cot-resp-pill cot-resp-pill-empty">Sin asignar</span>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="cot-aside-divider"/>
            <div className="cot-aside-help">
              <I.info size={14}/>
              <div>El número de oferta se mantiene sincronizado con el Deal de Bitrix24. Al cambiar la moneda, los totales se recalculan al tipo de cambio vigente.</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
