import * as NodeDef from '@core/survey/nodeDef'
import * as Node from '@core/record/node'
import * as Srs from '@core/geo/srs'

import * as SB from '../surveyBuilder'
import * as RB from '../recordBuilder'

export const createTestSurvey = ({ user }) =>
  SB.survey(
    user,
    SB.entity(
      'cluster',
      SB.attribute('cluster_id', NodeDef.nodeDefType.integer).key(),
      SB.attribute('cluster_location', NodeDef.nodeDefType.coordinate),
      SB.attribute('cluster_distance', NodeDef.nodeDefType.integer),
      SB.attribute('cluster_accessible', NodeDef.nodeDefType.boolean),
      SB.attribute('visit_date', NodeDef.nodeDefType.date),
      SB.attribute('visit_time', NodeDef.nodeDefType.time),
      SB.attribute('gps_model', NodeDef.nodeDefType.text),
      SB.attribute('remarks', NodeDef.nodeDefType.text),
      SB.entity(
        'plot',
        SB.attribute('plot_id', NodeDef.nodeDefType.integer).key(),
        SB.attribute('plot_location', NodeDef.nodeDefType.coordinate),
        SB.attribute('plot_multiple_number', NodeDef.nodeDefType.integer).multiple(),
        SB.entity(
          'tree',
          SB.attribute('tree_id', NodeDef.nodeDefType.integer).key(),
          SB.attribute('tree_status', NodeDef.nodeDefType.code).category('tree_status'),
          SB.attribute('tree_type', NodeDef.nodeDefType.code).category('tree_type'),
          SB.attribute('tree_height', NodeDef.nodeDefType.integer),
          SB.attribute('dbh', NodeDef.nodeDefType.decimal),
          SB.attribute('tree_species', NodeDef.nodeDefType.taxon)
        )
          .multiple()
          .renderAsTable()
      )
        .multiple()
        .displayInOwnPage()
    )
  )
    .categories(
      SB.category('simple_category', SB.categoryItem('1'), SB.categoryItem('2'), SB.categoryItem('3')),
      SB.category('hierarchical_category')
        .levels('level_1', 'level_2')
        .items(
          SB.categoryItem('1')
            .extra({ prop1: 'Extra prop1 item 1', prop2: 'Extra prop2 item 1' })
            .items(SB.categoryItem('1').extra({ prop1: 'Extra prop1 item 1-1', prop2: 'Extra prop2 item 1-1' })),
          SB.categoryItem('2')
            .extra({ prop1: 'Extra prop1 item 2', prop2: 'Extra prop2 item 2' })
            .items(
              SB.categoryItem('1').extra({ prop1: 'Extra prop1 item 2-1', prop2: 'Extra prop2 item 2-1' }),
              SB.categoryItem('2').extra({ prop1: 'Extra prop1 item 2-2', prop2: 'Extra prop2 item 2-2' }),
              SB.categoryItem('3').extra({ prop1: 'Extra prop1 item 2-3', prop2: 'Extra prop2 item 2-3' })
            ),
          SB.categoryItem('3')
            .extra({ prop1: 'Extra prop1 item 3', prop2: 'Extra prop2 item 3' })
            .items(SB.categoryItem('3a').extra({ prop1: 'Extra prop1 item 3a', prop2: 'Extra prop2 item 3a' }))
        ),
      SB.category('sampling_point')
        .levels('cluster', 'plot')
        .items(
          SB.categoryItem('11')
            .extra({ location: 'SRID=EPSG:4326;POINT(12.89463 42.00048)', region: 'Region 1' })
            .items(
              SB.categoryItem('1').extra({ location: 'SRID=EPSG:4326;POINT(12.88963 42.00548)', region: 'Region 1' }),
              SB.categoryItem('2').extra({ location: 'SRID=EPSG:4326;POINT(12.88963 41.99548)', region: 'Region 1' }),
              SB.categoryItem('3').extra({ location: 'SRID=EPSG:4326;POINT(12.89963 42.00548)', region: 'Region 1' }),
              SB.categoryItem('4').extra({ location: 'SRID=EPSG:4326;POINT(12.89963 41.99548)', region: 'Region 1' })
            ),
          SB.categoryItem('12')
            .extra({ location: 'SRID=EPSG:4326;POINT(12.99463 42.00048)', region: 'Region 2' })
            .items(
              SB.categoryItem('1').extra({ location: 'SRID=EPSG:4326;POINT(12.98963 42.00548)', region: 'Region 2' }),
              SB.categoryItem('2').extra({ location: 'SRID=EPSG:4326;POINT(12.98963 41.99548)', region: 'Region 2' }),
              SB.categoryItem('3').extra({ location: 'SRID=EPSG:4326;POINT(12.99963 42.00548)', region: 'Region 2' }),
              SB.categoryItem('4').extra({ location: 'SRID=EPSG:4326;POINT(12.99963 41.99548)', region: 'Region 2' })
            ),
          SB.categoryItem('13')
            .extra({ location: 'SRID=EPSG:4326;POINT(13.09463 42.00048)', region: 'Region 3' })
            .items(
              SB.categoryItem('1').extra({ location: 'SRID=EPSG:4326;POINT(13.08963 42.00548)', region: 'Region 3' }),
              SB.categoryItem('2').extra({ location: 'SRID=EPSG:4326;POINT(13.08963 41.99548)', region: 'Region 3' }),
              SB.categoryItem('3').extra({ location: 'SRID=EPSG:4326;POINT(13.09963 42.00548)', region: 'Region 3' }),
              SB.categoryItem('4').extra({ location: 'SRID=EPSG:4326;POINT(13.09963 41.99548)', region: 'Region 3' })
            )
        ),
      SB.category('tree_status', SB.categoryItem('L').label('Live'), SB.categoryItem('D').label('Dead')),
      SB.category(
        'tree_type',
        SB.categoryItem('T').label('Tree'),
        SB.categoryItem('F').label('Fern'),
        SB.categoryItem('L').label('Liana'),
        SB.categoryItem('P').label('Palm')
      )
    )
    .build()

export const createTestRecord = ({ user, survey }) =>
  RB.record(
    user,
    survey,
    RB.entity(
      'cluster',
      RB.attribute('cluster_id', 12),
      RB.attribute('cluster_location', {
        [Node.valuePropsCoordinate.srs]: Srs.latLongSrsCode,
        [Node.valuePropsCoordinate.x]: 41.883012,
        [Node.valuePropsCoordinate.y]: 12.489056,
      }),
      RB.attribute('cluster_distance', 18),
      RB.attribute('cluster_accessible', 'true'),
      RB.attribute('visit_date', '2021-01-01'),
      RB.attribute('visit_time', '10:30'),
      RB.attribute('gps_model', 'ABC-123-xyz'),
      RB.attribute('remarks', ''),
      RB.entity(
        'plot',
        RB.attribute('plot_id', 1),
        RB.attribute('plot_location', {
          [Node.valuePropsCoordinate.srs]: Srs.latLongSrsCode,
          [Node.valuePropsCoordinate.x]: 41.803012,
          [Node.valuePropsCoordinate.y]: 12.409056,
        }),
        RB.attribute('plot_multiple_number', 10),
        RB.attribute('plot_multiple_number', 20),
        RB.entity(
          'tree',
          RB.attribute('tree_id', 1),
          RB.attribute('tree_height', 10),
          RB.attribute('dbh', 7),
          RB.attribute('tree_species', {
            [Node.valuePropsTaxon.code]: 'ACA',
            [Node.valuePropsTaxon.scientificName]: 'Acacia sp.',
          })
        ),
        RB.entity('tree', RB.attribute('tree_id', 2), RB.attribute('tree_height', 11), RB.attribute('dbh', 10.123))
      ),
      RB.entity(
        'plot',
        RB.attribute('plot_id', 2),
        RB.attribute('plot_location', {
          [Node.valuePropsCoordinate.srs]: Srs.latLongSrsCode,
          [Node.valuePropsCoordinate.x]: 41.823012,
          [Node.valuePropsCoordinate.y]: 12.409056,
        }),
        RB.entity('tree', RB.attribute('tree_id', 1), RB.attribute('tree_height', 12), RB.attribute('dbh', 18)),
        RB.entity('tree', RB.attribute('tree_id', 2), RB.attribute('tree_height', 10), RB.attribute('dbh', 15)),
        RB.entity('tree', RB.attribute('tree_id', 3), RB.attribute('tree_height', 30), RB.attribute('dbh', 20))
      ),
      RB.entity(
        'plot',
        RB.attribute('plot_id', 3),
        RB.attribute('plot_multiple_number', 30),
        RB.entity('tree', RB.attribute('tree_id', 1), RB.attribute('tree_height', 13), RB.attribute('dbh', 19)),
        RB.entity('tree', RB.attribute('tree_id', 2), RB.attribute('tree_height', 10), RB.attribute('dbh', 15)),
        RB.entity('tree', RB.attribute('tree_id', 3), RB.attribute('tree_height', 11), RB.attribute('dbh', 16)),
        RB.entity('tree', RB.attribute('tree_id', 4), RB.attribute('tree_height', 10), RB.attribute('dbh', 7)),
        RB.entity('tree', RB.attribute('tree_id', 5), RB.attribute('tree_height', 33), RB.attribute('dbh', 22))
      )
    )
  ).build()
